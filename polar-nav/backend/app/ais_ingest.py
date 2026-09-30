"""
Run this as a separate long-lived process (not inside the API request path):

    python -m app.ais_ingest
"""

from . import ssl_patch  # noqa: F401

import asyncio
import json
import websockets

from .config import AISSTREAM_API_KEY
from .supabase_client import supabase

AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream"

BOUNDING_BOX = [[[-85.0, -180.0], [85.0, 180.0]]]


def _is_valid_position(lat, lon):
    if lat is None or lon is None:
        return False
    return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0


async def stream_positions():
    skipped_count = 0

    async with websockets.connect(AISSTREAM_URL) as ws:
        await ws.send(json.dumps({
            "APIKey": AISSTREAM_API_KEY,
            "BoundingBoxes": BOUNDING_BOX,
        }))

        async for message in ws:
            data = json.loads(message)
            report = data.get("Message", {}).get("PositionReport")
            if not report:
                continue

            mmsi = str(report.get("UserID"))
            lat = report.get("Latitude")
            lon = report.get("Longitude")
            speed = report.get("Sog")
            heading = report.get("TrueHeading")

            if not _is_valid_position(lat, lon):
                skipped_count += 1
                if skipped_count % 50 == 0:
                    print(f"skipped {skipped_count} invalid position reports so far")
                continue

            existing = supabase.table("ships").select("id").eq("mmsi", mmsi).execute()
            if existing.data:
                ship_id = existing.data[0]["id"]
            else:
                created = supabase.table("ships").insert(
                    {"name": f"Vessel {mmsi}", "mmsi": mmsi}
                ).execute()
                ship_id = created.data[0]["id"]

            supabase.table("ship_positions").insert({
                "ship_id": ship_id,
                "lat": lat,
                "lon": lon,
                "speed_knots": speed,
                "heading": heading,
            }).execute()

            print(f"stored position for {mmsi}: {lat}, {lon}")


async def run_forever():
    while True:
        try:
            await stream_positions()
        except Exception as e:
            print(f"AIS connection dropped: {e}. Reconnecting in 5s...")
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(run_forever())
