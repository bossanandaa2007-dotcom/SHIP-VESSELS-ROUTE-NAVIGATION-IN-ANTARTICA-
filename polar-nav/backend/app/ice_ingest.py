"""
Run periodically:

    python -m app.ice_ingest

Before running: replace DATASET_ID below with the exact dataset id
from the Copernicus product's "Data access" tab.
"""

from . import ssl_patch  # noqa: F401

import tempfile
from pathlib import Path

import copernicusmarine
import xarray as xr
from datetime import datetime, timedelta

from .supabase_client import supabase

DATASET_ID = "cmems_mod_glo_phy_anfc_0.083deg_P1D-m"

BBOX = {
    "minimum_longitude": 0.0,
    "maximum_longitude": 90.0,
    "minimum_latitude": -70.0,
    "maximum_latitude": -30.0,
}

OUTPUT_FILE = str(Path(tempfile.gettempdir()) / "ice_subset.nc")


def fetch_and_store():
    now = datetime.utcnow()
    copernicusmarine.subset(
        dataset_id=DATASET_ID,
        variables=["siconc", "sithick"],
        start_datetime=now.strftime("%Y-%m-%dT00:00:00"),
        end_datetime=(now + timedelta(days=3)).strftime("%Y-%m-%dT00:00:00"),
        output_filename=OUTPUT_FILE,
        force_download=True,
        **BBOX,
    )

    ds = xr.open_dataset(OUTPUT_FILE)
    first_step = ds.isel(time=0)

    lats = first_step.latitude.values[::10]
    lons = first_step.longitude.values[::10]

    rows = []
    for lat in lats:
        for lon in lons:
            try:
                point = first_step.sel(latitude=lat, longitude=lon, method="nearest")
                conc = float(point["siconc"].values) * 100
                if conc != conc:
                    continue
                rows.append({
                    "cell_lat": float(lat),
                    "cell_lon": float(lon),
                    "concentration": conc,
                })
            except Exception:
                continue

    if rows:
        supabase.table("ice_snapshots").insert(rows).execute()
        print(f"stored {len(rows)} ice concentration cells")


if __name__ == "__main__":
    import time

    while True:
        fetch_and_store()
        time.sleep(1800)
