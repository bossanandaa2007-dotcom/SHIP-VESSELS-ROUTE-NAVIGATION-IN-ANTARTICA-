"""
Run periodically:

    python -m app.weather_ingest
"""

from . import ssl_patch  # noqa: F401

import httpx

from .config import OPEN_METEO_MARINE_URL
from .supabase_client import supabase

# Open-Meteo's Marine API doesn't support wind/temperature fields (they come
# back with "undefined" units and null values) — only wave height. Wind and
# temperature come from the separate general Forecast API instead.
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

GRID_POINTS = [
    (-34.0, 18.0),
    (-45.0, 30.0),
    (-55.0, 45.0),
    (-65.0, 60.0),
]


def fetch_wind_temp(lat, lon):
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "wind_speed_10m,wind_direction_10m,temperature_2m",
        "forecast_days": 5,
    }
    r = httpx.get(OPEN_METEO_FORECAST_URL, params=params, timeout=20)
    r.raise_for_status()
    return r.json().get("hourly", {})


def fetch_and_store(lat, lon):
    marine_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "wave_height",
        "forecast_days": 3,
    }
    r = httpx.get(OPEN_METEO_MARINE_URL, params=marine_params, timeout=20)
    r.raise_for_status()
    waves = r.json().get("hourly", {}).get("wave_height", [])

    wind_hourly = fetch_wind_temp(lat, lon)
    winds = wind_hourly.get("wind_speed_10m", [])
    wind_dirs = wind_hourly.get("wind_direction_10m", [])
    temps = wind_hourly.get("temperature_2m", [])

    if waves or winds:
        wind0 = winds[0] if winds else None
        wave0 = waves[0] if waves else None
        supabase.table("weather_snapshots").insert({
            "cell_lat": lat,
            "cell_lon": lon,
            "wave_height": wave0,
            "wind_speed": wind0,
            "wind_direction": wind_dirs[0] if wind_dirs else None,
            "temperature": temps[0] if temps else None,
            "storm_flag": (wind0 or 0) > 45,
        }).execute()
        print(f"stored weather for ({lat}, {lon}): wind={wind0} wave={wave0}")


def fetch_forecast(lat, lon):
    """Real 5-day daily forecast from the same Forecast API used for
    wind/temperature — verified against the live response to return real
    (non-null) values before this was written."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_max,temperature_2m_min,wind_speed_10m_max",
        "forecast_days": 5,
    }
    r = httpx.get(OPEN_METEO_FORECAST_URL, params=params, timeout=20)
    r.raise_for_status()
    daily = r.json().get("daily", {})
    dates = daily.get("time", [])
    temp_max = daily.get("temperature_2m_max", [])
    temp_min = daily.get("temperature_2m_min", [])
    wind_max = daily.get("wind_speed_10m_max", [])

    rows = [
        {
            "cell_lat": lat,
            "cell_lon": lon,
            "forecast_date": date,
            "temp_max": temp_max[i] if i < len(temp_max) else None,
            "temp_min": temp_min[i] if i < len(temp_min) else None,
            "wind_max": wind_max[i] if i < len(wind_max) else None,
        }
        for i, date in enumerate(dates)
    ]
    if rows:
        supabase.table("forecast_snapshots").insert(rows).execute()
        print(f"stored {len(rows)}-day forecast for ({lat}, {lon})")


if __name__ == "__main__":
    import time

    while True:
        for lat, lon in GRID_POINTS:
            fetch_and_store(lat, lon)
            fetch_forecast(lat, lon)
        time.sleep(1800)
