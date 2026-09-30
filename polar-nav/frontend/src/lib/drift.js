/**
 * Iceberg drift estimation — dead reckoning, NOT live tracking.
 *
 * Real iceberg fixes come from the `icebergs` table (lat/lon/last_seen) and
 * only change when that table is re-populated (it isn't, currently — there's
 * no ingestion job for it yet). Between refreshes we nudge the *displayed*
 * position using the standard "2% of wind speed, in the direction the wind
 * is blowing toward" rule — a well-known baseline approximation for surface
 * wind-driven drift, not a claim of precision. Real iceberg motion also
 * depends on ocean currents, iceberg keel depth/draft, Coriolis deflection,
 * and more, none of which this models.
 */

const EARTH_RADIUS_KM = 6371
const KM_PER_DEGREE_LAT = (Math.PI / 180) * EARTH_RADIUS_KM // ~111.19 km/deg

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

/**
 * The direction the wind is blowing TOWARD (i.e. the direction a
 * wind-driven object like an iceberg drifts), given the meteorological
 * `wind_direction` (the direction the wind blows FROM).
 */
export function driftBearingDeg(windDirection) {
  return ((Number(windDirection) || 0) + 180) % 360
}

export function bearingToCompass(deg) {
  const idx = Math.round((((Number(deg) || 0) % 360) / 45)) % COMPASS_POINTS.length
  return COMPASS_POINTS[idx]
}

// Log the first real wind values this module ever sees, so it's easy to
// confirm at runtime that it's actually wired to weather_snapshots and not
// silently falling back to a placeholder.
let hasLoggedFirstUse = false

/**
 * @param {{lat: number, lon: number, last_seen?: string}} iceberg - last real fix
 * @param {{wind_speed?: number, wind_direction?: number} | null} latestWeather
 *   wind_speed in km/h, wind_direction in degrees — meteorological
 *   convention (the direction the wind is blowing FROM).
 * @param {number} [now] - ms epoch, defaults to Date.now(); overridable for tests.
 * @returns {{lat: number, lon: number, driftKm: number}} estimated current position
 */
export function estimateIcebergDrift(iceberg, latestWeather, now = Date.now()) {
  const { lat, lon, last_seen: lastSeen } = iceberg

  if (!hasLoggedFirstUse && latestWeather) {
    hasLoggedFirstUse = true
    console.log(
      '[drift.js] first real wind values from weather_snapshots:',
      `wind_speed=${latestWeather.wind_speed} km/h,`,
      `wind_direction=${latestWeather.wind_direction}°`,
    )
  }

  if (lat == null || lon == null || !latestWeather?.wind_speed || !lastSeen) {
    return { lat, lon, driftKm: 0 }
  }

  const elapsedHours = Math.max(0, (now - new Date(lastSeen).getTime()) / 3_600_000)
  if (elapsedHours === 0) return { lat, lon, driftKm: 0 }

  // The "2% wind rule": surface drift speed ≈ 2% of wind speed.
  const driftSpeedKmh = Number(latestWeather.wind_speed) * 0.02
  const driftKm = driftSpeedKmh * elapsedHours

  // wind_direction is where the wind comes FROM; the berg drifts the
  // opposite way — toward where the wind is blowing.
  const bearingDeg = ((Number(latestWeather.wind_direction) || 0) + 180) % 360
  const bearingRad = (bearingDeg * Math.PI) / 180

  const dLat = (driftKm * Math.cos(bearingRad)) / KM_PER_DEGREE_LAT
  const kmPerDegreeLon = KM_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180)
  const dLon = kmPerDegreeLon > 0 ? (driftKm * Math.sin(bearingRad)) / kmPerDegreeLon : 0

  return { lat: lat + dLat, lon: lon + dLon, driftKm }
}
