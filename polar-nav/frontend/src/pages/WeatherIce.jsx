import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { CloudSnow } from 'lucide-react'
import Card from '../components/Card'
import WeatherPanel from '../components/WeatherPanel'
import SeaIcePanel from '../components/SeaIcePanel'
import { haversineKm } from '../lib/format'
import { fetchForecast } from '../lib/supabaseQueries'
import { supabase } from '../supabaseClient'
import { driftBearingDeg, bearingToCompass } from '../lib/drift'

const TABS = ['Weather Conditions', 'Sea Ice', 'Icebergs']

// Same Cape Town grid point weather_ingest.py writes first (GRID_POINTS[0]).
const FORECAST_POINT = { lat: -34.0, lon: 18.0 }

// Hardcoded reference point for iceberg distance (Maitri station).
const REF = { name: 'Maitri station', lat: -70.77, lon: 11.73 }

const fmtDay = (isoDate) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

export default function WeatherIce() {
  const { icebergs } = useOutletContext()
  const [tab, setTab] = useState(TABS[0])
  const [forecast, setForecast] = useState(null) // null = loading, [] = no rows yet
  const [forecastError, setForecastError] = useState(null)
  const [windDirection, setWindDirection] = useState(null) // null = no reading yet

  useEffect(() => {
    let active = true
    supabase
      .from('weather_snapshots')
      .select('wind_direction')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (active) setWindDirection(data?.[0]?.wind_direction ?? null)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchForecast(FORECAST_POINT.lat, FORECAST_POINT.lon)
      .then((rows) => {
        if (!active) return
        setForecast(
          rows.map((r) => ({
            day: fmtDay(r.forecast_date),
            tempMax: r.temp_max,
            tempMin: r.temp_min,
            windMax: r.wind_max,
          })),
        )
      })
      .catch((err) => active && setForecastError(err.message))
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="p-3 space-y-3">
      <div className="flex gap-4 border-b border-[#1e293b] px-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`pb-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-sky-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Weather Conditions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <WeatherPanel />
          <Card title="Forecast (Next 5 Days)" icon={CloudSnow}>
            {forecastError ? (
              <p className="text-xs text-red-400">
                Couldn&apos;t load forecast: {forecastError}
              </p>
            ) : !forecast?.length ? (
              <p className="text-xs text-slate-500">
                {forecast === null
                  ? 'Loading forecast…'
                  : 'No forecast_snapshots rows yet for this grid point.'}
              </p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecast} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="°" />
                    <Tooltip
                      contentStyle={{
                        background: '#0b1322',
                        border: '1px solid #1e293b',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="tempMax"
                      name="Temp max °C"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tempMin"
                      name="Temp min °C"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="mt-2 text-[10px] text-emerald-500/80">
              real · <code>forecast_snapshots</code> for Cape Town (
              {FORECAST_POINT.lat}, {FORECAST_POINT.lon}) · Open-Meteo Forecast
              API
            </p>
          </Card>
        </div>
      )}

      {tab === 'Sea Ice' && (
        <div className="max-w-md">
          <SeaIcePanel />
          <p className="mt-2 text-[10px] text-slate-500">
            Heatmap thumbnail from the design is omitted — the band legend above is
            the only real reference.
          </p>
        </div>
      )}

      {tab === 'Icebergs' && (
        <Card title="Iceberg Detection" icon={CloudSnow}>
          {!icebergs.length ? (
            <p className="text-xs text-slate-500">
              No rows in the <code>icebergs</code> table yet.
            </p>
          ) : (
            <ul className="divide-y divide-[#1e293b]">
              {icebergs.map((b, i) => {
                const dNm =
                  b.lat != null && b.lon != null
                    ? haversineKm([REF.lat, REF.lon], [b.lat, b.lon]) / 1.852
                    : null
                const compass =
                  windDirection != null ? bearingToCompass(driftBearingDeg(windDirection)) : null
                return (
                  <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-200">{b.name ?? `Iceberg ${i + 1}`}</span>
                    <span className="flex items-center gap-3 text-xs">
                      <span className="text-slate-300 tabular-nums">
                        {dNm != null ? `${dNm.toFixed(1)} nm` : '—'}
                      </span>
                      <span className="text-slate-500">
                        {compass ? `Moving ${compass}` : 'No wind reading yet'}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-3 text-[10px] text-emerald-500/80">
            real · name + position from <code>icebergs</code>; distance = Haversine from{' '}
            {REF.name} ({REF.lat}, {REF.lon}). Direction = dead-reckoning drift bearing
            from the latest <code>weather_snapshots</code> wind_direction (2% wind rule),
            same model driving the map markers.
          </p>
        </Card>
      )}
    </div>
  )
}
