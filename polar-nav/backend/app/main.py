from . import ssl_patch  # noqa: F401

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .routing import build_cost_grid, shortest_route
from .supabase_client import supabase

app = FastAPI(title="Polar Navigation Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RouteRequest(BaseModel):
    ship_id: str
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/compute-route")
def compute_route(req: RouteRequest):
    def ice_lookup(lat, lon):
        rows = (
            supabase.table("ice_snapshots")
            .select("concentration")
            .order("recorded_at", desc=True)
            .limit(1)
            .execute()
        )
        return rows.data[0]["concentration"] if rows.data else 20

    def weather_lookup(lat, lon):
        rows = (
            supabase.table("weather_snapshots")
            .select("wind_speed,wave_height,storm_flag")
            .order("recorded_at", desc=True)
            .limit(1)
            .execute()
        )
        if rows.data:
            r = rows.data[0]
            return {
                "wind_speed": r["wind_speed"],
                "wave_height": r["wave_height"],
                "storm_flag": r["storm_flag"],
            }
        return {"wind_speed": 10, "wave_height": 1, "storm_flag": False}

    iceberg_rows = supabase.table("icebergs").select("lat,lon,size_km").execute()
    iceberg_points = [(r["lat"], r["lon"], r["size_km"]) for r in iceberg_rows.data]

    lat_range = sorted([req.origin_lat, req.dest_lat])
    lon_range = sorted([req.origin_lon, req.dest_lon])

    g, node_id = build_cost_grid(
        lat_range, lon_range, step=1.0,
        ice_lookup=ice_lookup,
        iceberg_points=iceberg_points,
        weather_lookup=weather_lookup,
    )

    path, cost = shortest_route(
        g, node_id,
        (req.origin_lat, req.origin_lon),
        (req.dest_lat, req.dest_lon),
    )

    route = supabase.table("routes").insert({
        "ship_id": req.ship_id,
        "origin_lat": req.origin_lat, "origin_lon": req.origin_lon,
        "dest_lat": req.dest_lat, "dest_lon": req.dest_lon,
        "status": "computed",
    }).execute()
    route_id = route.data[0]["id"]

    geojson = {"type": "LineString", "coordinates": [[lo, la] for la, lo in path]}
    supabase.table("route_options").insert({
        "route_id": route_id,
        "label": "Recommended",
        "path_geojson": geojson,
        "risk_score": cost,
        "recommended": True,
    }).execute()

    return {"route_id": route_id, "path": path, "risk_score": cost}
