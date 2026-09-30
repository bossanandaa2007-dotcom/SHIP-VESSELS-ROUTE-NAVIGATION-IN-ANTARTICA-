import { supabase } from '../supabaseClient'

/**
 * Real 5-day forecast for one grid point, from `forecast_snapshots`
 * (see supabase/migrations/005_create_forecast_snapshots.sql). Each
 * weather_ingest run inserts 5 rows (one per forecast_date) per grid
 * point, so we take the latest-inserted batch for that point and sort
 * it back into date order.
 */
export async function fetchForecast(lat, lon) {
  const { data, error } = await supabase
    .from('forecast_snapshots')
    .select('forecast_date, temp_max, temp_min, wind_max, recorded_at')
    .eq('cell_lat', lat)
    .eq('cell_lon', lon)
    .order('recorded_at', { ascending: false })
    .limit(5)

  if (error) throw error

  return (data ?? [])
    .slice()
    .sort((a, b) => a.forecast_date.localeCompare(b.forecast_date))
}
