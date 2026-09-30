import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Real fleet data: the `ships` table + the latest row per ship from
 * `ship_positions`, kept live via a Supabase Realtime subscription on
 * INSERTs to `ship_positions`.
 */
export function useFleet() {
  const [ships, setShips] = useState([])
  // Total row count from Postgres directly (a HEAD request, no rows
  // transferred) — NOT subject to PostgREST's default 1000-row response
  // cap, unlike ships.length once the fleet passes 1000 vessels.
  const [shipsCount, setShipsCount] = useState(null)
  const [positions, setPositions] = useState({}) // ship_id -> latest ship_positions row
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function loadShips() {
      const { data } = await supabase.from('ships').select('*').order('name')
      if (active && data) setShips(data)
    }

    async function load() {
      try {
        const [shipsRes, countRes, posRes] = await Promise.all([
          supabase.from('ships').select('*').order('name'),
          supabase.from('ships').select('*', { count: 'exact', head: true }),
          // Single server-side DISTINCT ON query (see migration
          // 004_latest_ship_positions_rpc) instead of fetching a capped
          // window of raw rows and reducing client-side — correct and
          // O(ships) regardless of fleet size or position volume.
          supabase.rpc('latest_ship_positions'),
        ])
        if (shipsRes.error) throw shipsRes.error
        if (countRes.error) throw countRes.error
        if (posRes.error) throw posRes.error

        const latest = {}
        for (const p of posRes.data ?? []) {
          latest[p.ship_id] = p
        }
        if (!active) return
        setShips(shipsRes.data ?? [])
        setShipsCount(countRes.count ?? shipsRes.data?.length ?? 0)
        setPositions(latest)
        setStatus('ready')
      } catch (err) {
        if (!active) return
        setError(err?.message ?? String(err))
        setStatus('error')
      }
    }

    load()

    const channel = supabase
      .channel('ship_positions_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ship_positions' },
        (payload) => {
          const p = payload.new
          setPositions((prev) => {
            const cur = prev[p.ship_id]
            if (cur && new Date(cur.recorded_at) >= new Date(p.recorded_at)) return prev
            return { ...prev, [p.ship_id]: p }
          })
          setShips((prev) => {
            if (prev.some((s) => s.id === p.ship_id)) return prev
            loadShips() // a position arrived for a ship we haven't loaded yet
            return prev
          })
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  return { ships, shipsCount, positions, status, error }
}
