import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

/** Real iceberg data from the `icebergs` table. */
export function useIcebergs() {
  const [icebergs, setIcebergs] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    supabase
      .from('icebergs')
      .select('*')
      .then(({ data, error: err }) => {
        if (!active) return
        if (err) setError(err.message)
        else setIcebergs(data ?? [])
      })
    return () => {
      active = false
    }
  }, [])

  return { icebergs, error }
}
