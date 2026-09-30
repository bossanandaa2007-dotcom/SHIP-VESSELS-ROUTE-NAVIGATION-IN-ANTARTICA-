import { useState } from 'react'

export default function RouteForm({ onResult }) {
  const [form, setForm] = useState({
    ship_id: '',
    origin_lat: -34,
    origin_lon: 18,
    dest_lat: -69,
    dest_lon: 76,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.ship_id) {
      setError('Enter a ship ID first')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/compute-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`Backend returned ${res.status}`)
      const data = await res.json()
      onResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
      <label>
        Ship ID (uuid from the ships table)
        <input value={form.ship_id} onChange={update('ship_id')} />
      </label>
      <label>
        Origin lat / lon
        <input type="number" value={form.origin_lat} onChange={update('origin_lat')} />
        <input type="number" value={form.origin_lon} onChange={update('origin_lon')} />
      </label>
      <label>
        Destination lat / lon
        <input type="number" value={form.dest_lat} onChange={update('dest_lat')} />
        <input type="number" value={form.dest_lon} onChange={update('dest_lon')} />
      </label>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Computing…' : 'Compute recommended route'}
      </button>
    </form>
  )
}
