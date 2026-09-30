import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { fmtTimeUTC } from '../lib/format'
import { supabase } from '../supabaseClient'
import { estimateIcebergDrift } from '../lib/drift'
import MapReadyFix from './MapReadyFix'

const DRIFT_REFRESH_MS = 30_000
const WORLD_BOUNDS = [
  [-85, -180],
  [85, 180],
]

// This is the "World Map" — force the true whole-world view on mount
// rather than relying on the center/zoom props below, which were left
// over from an earlier Antarctica-centered default and no longer match
// what this map is supposed to show.
function WorldViewFix() {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(WORLD_BOUNDS)
  }, [map])
  return null
}

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  )

// AIS TrueHeading uses 511 as "not available" — only 0-359 is a real bearing.
function hasRealHeading(heading) {
  return heading != null && Number.isFinite(Number(heading)) && Number(heading) < 360
}

function shipIcon(name, kn, heading) {
  const label =
    esc(name ?? 'Vessel') + (kn != null ? ` · ${Number(kn).toFixed(1)} kn` : '')
  // Compass heading (clockwise from north) maps directly onto a CSS
  // rotation of an upward-pointing triangle (also "up" = 0deg/north).
  const glyph = hasRealHeading(heading)
    ? `<span class="pn-ship-arrow" style="transform: rotate(${Number(heading)}deg)"></span>`
    : '<span class="pn-ship-dot"></span>'
  return L.divIcon({
    className: 'pn-marker',
    html: `<div class="pn-ship">${glyph}<span class="pn-ship-label">${label}</span></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

function icebergIcon() {
  return L.divIcon({
    className: 'pn-marker',
    html: '<div class="pn-berg"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function LegendRow({ color, label, triangle }) {
  return (
    <div className="flex items-center gap-2">
      {triangle ? (
        <span
          className="inline-block"
          style={{
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderBottom: `9px solid ${color}`,
          }}
        />
      ) : (
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: color }}
        />
      )}
      {label}
    </div>
  )
}

export default function MapView({ ships, positions, icebergs, routePath, onSelectShip }) {
  const shipById = Object.fromEntries((ships ?? []).map((s) => [s.id, s]))

  const markers = Object.entries(positions ?? {})
    .filter(([, p]) => p && p.lat != null && p.lon != null)
    .map(([shipId, p]) => ({ p, ship: shipById[shipId] }))

  // Latest real wind reading, used only to *estimate* iceberg drift below —
  // re-fetched on the same interval that nudges the displayed positions.
  const [latestWeather, setLatestWeather] = useState(null)
  const [driftNow, setDriftNow] = useState(() => Date.now())

  useEffect(() => {
    let active = true
    const fetchWeather = () => {
      supabase
        .from('weather_snapshots')
        .select('wind_speed, wind_direction')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (active) setLatestWeather(data?.[0] ?? null)
        })
    }
    fetchWeather()
    const id = setInterval(() => {
      fetchWeather()
      setDriftNow(Date.now())
    }, DRIFT_REFRESH_MS)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  const bergs = (icebergs ?? [])
    .filter((b) => b.lat != null && b.lon != null)
    .map((b) => ({ ...b, drift: estimateIcebergDrift(b, latestWeather, driftNow) }))

  const line =
    Array.isArray(routePath) && routePath.length > 1
      ? routePath.map(([lat, lon]) => [lat, lon])
      : null

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={[0, 0]}
        zoom={2}
        minZoom={2}
        worldCopyJump
        className="h-full w-full [&_.leaflet-tile-pane]:invert [&_.leaflet-tile-pane]:hue-rotate-180"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <WorldViewFix />
        <MapReadyFix />

        {markers.map(({ p, ship }) => (
          <Marker
            key={p.ship_id}
            position={[p.lat, p.lon]}
            icon={shipIcon(ship?.name, p.speed_knots, p.heading)}
            eventHandlers={{ click: () => ship && onSelectShip?.(ship) }}
          >
            <Popup>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold">{ship?.name ?? 'Unknown vessel'}</div>
                <div>
                  {Number(p.lat).toFixed(3)}, {Number(p.lon).toFixed(3)}
                </div>
                <div>
                  Speed: {p.speed_knots ?? '—'} kn · Heading: {p.heading ?? '—'}°
                </div>
                <div>Updated {fmtTimeUTC(p.recorded_at)}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {bergs.map((b) => (
          <Marker
            key={b.id}
            position={[b.drift.lat, b.drift.lon]}
            icon={icebergIcon()}
          >
            <Popup>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold">{b.name ?? 'Iceberg'}</div>
                <div>
                  Last real fix: {Number(b.lat).toFixed(3)}, {Number(b.lon).toFixed(3)}
                </div>
                {b.size_km != null && <div>~{b.size_km} km</div>}
                <div className="pt-1 mt-1 border-t border-slate-700 text-amber-300">
                  Estimated drift (dead reckoning)
                  {b.drift.driftKm > 0 && `: ${b.drift.driftKm.toFixed(1)} km`}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {line && (
          <Polyline
            positions={line}
            pathOptions={{ color: '#34d399', weight: 3, dashArray: '6 8' }}
          />
        )}
      </MapContainer>

      <div className="absolute top-3 right-3 z-[1000] bg-[#0b1322]/90 border border-[#1e293b] rounded-lg p-3 text-[11px] text-slate-300 space-y-1.5 max-w-[240px]">
        <div className="font-semibold text-slate-200">Legend</div>
        <LegendRow color="#22c55e" label={`Ship — real, live (${markers.length})`} />
        <LegendRow triangle color="#93c5fd" label={`Iceberg — real fix (${bergs.length})`} />
        <div className="flex items-center gap-2 text-amber-300/90">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: '#fbbf24' }}
          />
          Iceberg position: estimated drift (dead reckoning)
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 border-t-2 border-dashed border-emerald-400" />
          Recommended route — /compute-route
        </div>
        <div className="pt-1.5 border-t border-[#1e293b] text-slate-500">
          Storm swirls &amp; the sea-ice heatmap from the design are stylised art,
          not a real gridded layer — omitted here.
        </div>
        <div className="pt-1.5 border-t border-[#1e293b] text-slate-500">
          This map uses standard Mercator projection, which distorts scale
          near the poles. A true polar-stereographic view is a possible
          future upgrade.
        </div>
      </div>
    </div>
  )
}
