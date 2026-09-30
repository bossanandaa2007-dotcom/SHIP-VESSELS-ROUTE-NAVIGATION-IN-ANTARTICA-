export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

/** Calls the real FastAPI POST /compute-route endpoint. */
export async function computeRoute({ shipId, originLat, originLon, destLat, destLon }) {
  const res = await fetch(`${API_BASE}/compute-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ship_id: shipId,
      origin_lat: originLat,
      origin_lon: originLon,
      dest_lat: destLat,
      dest_lon: destLon,
    }),
  })
  if (!res.ok) throw new Error(`Backend returned ${res.status}`)
  return res.json()
}
