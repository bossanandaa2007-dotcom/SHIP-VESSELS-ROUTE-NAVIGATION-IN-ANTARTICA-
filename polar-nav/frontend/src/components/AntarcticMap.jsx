import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, Circle } from 'react-leaflet'
import L from 'leaflet'
import { fmtTimeUTC } from '../lib/format'
import MapReadyFix from './MapReadyFix'

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  )

// Real, publicly known research station coordinates.
const STATIONS = [
  { name: 'McMurdo Station', country: 'US', lat: -77.85, lon: 166.67 },
  { name: 'Amundsen-Scott South Pole Station', country: 'US', lat: -90, lon: 0 },
  { name: 'Palmer Station', country: 'US', lat: -64.77, lon: -64.05 },
  { name: 'Rothera', country: 'UK', lat: -67.57, lon: -68.13 },
  { name: 'Bharati', country: 'India', lat: -69.4, lon: 76.19, india: true },
  { name: 'Maitri', country: 'India', lat: -70.77, lon: 11.73, india: true },
  { name: 'Vostok', country: 'Russia', lat: -78.46, lon: 106.84 },
  { name: 'Casey', country: 'Australia', lat: -66.28, lon: 110.53 },
]

// Fit the whole station/sea longitude spread (-175° to 167°) regardless of
// container width, instead of a fixed zoom that clips edge labels (e.g.
// Casey at 110°E) on narrower windows.
const VIEW_BOUNDS = [
  [-90, -180],
  [-55, 180],
]

// Approximate label centers, matching the reference map's layout.
const SEAS = [
  { name: 'Weddell Sea', lat: -72, lon: -45 },
  { name: 'Ross Sea', lat: -75, lon: -175 },
  { name: 'Amundsen Sea', lat: -73, lon: -110 },
  { name: 'Bellingshausen Sea', lat: -71, lon: -85 },
]

function stationIcon(india) {
  return L.divIcon({
    className: 'pn-marker',
    html: `<div class="${india ? 'pn-station-india' : 'pn-station'}"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
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

function shipIcon(name, kn) {
  const label =
    esc(name ?? 'Vessel') + (kn != null ? ` · ${Number(kn).toFixed(1)} kn` : '')
  return L.divIcon({
    className: 'pn-marker',
    html: `<div class="pn-ship"><span class="pn-ship-dot"></span><span class="pn-ship-label">${label}</span></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

// Invisible anchor point that carries a permanent text-only Tooltip — the
// standard Leaflet pattern for a floating map label with no marker glyph.
function labelIcon() {
  return L.divIcon({ className: 'pn-marker', html: '', iconSize: [0, 0] })
}

export default function AntarcticMap({ ships, positions, icebergs, routePath }) {
  const shipById = Object.fromEntries((ships ?? []).map((s) => [s.id, s]))

  const southernShips = Object.entries(positions ?? {})
    .map(([shipId, p]) => ({ p, ship: shipById[shipId] }))
    .filter(({ p }) => p && p.lat != null && p.lon != null && p.lat < -60)

  const bergs = (icebergs ?? []).filter((b) => b.lat != null && b.lon != null)

  const line =
    Array.isArray(routePath) && routePath.length > 1
      ? routePath.map(([lat, lon]) => [lat, lon])
      : null

  return (
    <div className="absolute inset-0">
      <MapContainer
        bounds={VIEW_BOUNDS}
        minZoom={2}
        maxBounds={VIEW_BOUNDS}
        maxBoundsViscosity={1.0}
        className="h-full w-full [&_.leaflet-tile-pane]:invert [&_.leaflet-tile-pane]:hue-rotate-180"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <MapReadyFix />

        {/* research stations — real, publicly known coordinates */}
        {STATIONS.map((s) => {
          // Labels point toward the map's vertical centerline instead of
          // always right, so stations near the east/west edges (e.g. Casey
          // at 110°E) don't push their text off the container.
          const direction = s.lon > 0 ? 'left' : 'right'
          const offset = s.lon > 0 ? [-6, 0] : [6, 0]
          return (
            <Marker key={s.name} position={[s.lat, s.lon]} icon={stationIcon(s.india)}>
              <Popup>
                <div className="text-xs space-y-0.5">
                  <div className="font-semibold">
                    {s.name}
                    {s.india && ' 🇮🇳'}
                  </div>
                  <div>{s.country}</div>
                  <div>
                    {s.lat.toFixed(2)}, {s.lon.toFixed(2)}
                  </div>
                </div>
              </Popup>
              <Tooltip
                permanent
                direction={direction}
                offset={offset}
                className={s.india ? 'pn-station-label pn-station-label-india' : 'pn-station-label'}
              >
                {s.name}
              </Tooltip>
            </Marker>
          )
        })}

        {/* dashed highlight ring around the two India stations */}
        {STATIONS.filter((s) => s.india).map((s) => (
          <Circle
            key={`${s.name}-ring`}
            center={[s.lat, s.lon]}
            radius={250_000}
            pathOptions={{
              color: '#fb923c',
              weight: 1.5,
              dashArray: '4 4',
              fill: false,
            }}
          />
        ))}

        {/* sea names — static text labels, matching the reference layout */}
        {SEAS.map((sea) => (
          <Marker key={sea.name} position={[sea.lat, sea.lon]} icon={labelIcon()} interactive={false}>
            <Tooltip permanent direction="center" className="pn-sea-label">
              {sea.name}
            </Tooltip>
          </Marker>
        ))}

        {/* real icebergs */}
        {bergs.map((b) => (
          <Marker key={b.id} position={[b.lat, b.lon]} icon={icebergIcon()}>
            <Popup>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold">{b.name ?? 'Iceberg'}</div>
                <div>
                  {Number(b.lat).toFixed(3)}, {Number(b.lon).toFixed(3)}
                </div>
                {b.size_km != null && <div>~{b.size_km} km</div>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* real ships south of 60°S, if any are currently reporting there */}
        {southernShips.map(({ p, ship }) => (
          <Marker
            key={p.ship_id}
            position={[p.lat, p.lon]}
            icon={shipIcon(ship?.name, p.speed_knots)}
          >
            <Popup>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold">{ship?.name ?? 'Unknown vessel'}</div>
                <div>
                  {Number(p.lat).toFixed(3)}, {Number(p.lon).toFixed(3)}
                </div>
                <div>Speed: {p.speed_knots ?? '—'} kn</div>
                <div>Updated {fmtTimeUTC(p.recorded_at)}</div>
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
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
          Research station — real coordinates (static)
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" />
          Bharati &amp; Maitri (India) — highlighted
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
          {`Ship — real, live (${southernShips.length})`}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block"
            style={{
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: '9px solid #93c5fd',
            }}
          />
          {`Iceberg — real fix (${bergs.length})`}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 border-t-2 border-dashed border-emerald-400" />
          Recommended route — /compute-route
        </div>
        {southernShips.length === 0 && (
          <div className="pt-1.5 border-t border-[#1e293b] text-slate-500">
            No live vessels currently south of 60°S.
          </div>
        )}
      </div>
    </div>
  )
}
