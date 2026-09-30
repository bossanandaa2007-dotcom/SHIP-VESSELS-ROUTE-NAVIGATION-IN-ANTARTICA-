import { useEffect, useState } from 'react'
import { CloudSnow, Wind, Compass, Waves, Thermometer } from 'lucide-react'
import Card from './Card'
import { supabase } from '../supabaseClient'

export default function WeatherPanel() {
  const [row, setRow] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    supabase
      .from('weather_snapshots')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!active) return
        setRow(data?.[0] ?? null)
        setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  const real = (v, unit) =>
    v == null ? (loaded ? 'no data' : '…') : `${v}${unit}`

  return (
    <Card title="Weather Conditions" icon={CloudSnow} live>
      <div className="grid grid-cols-2 gap-3">
        <Tile
          icon={Wind}
          label="Wind Speed"
          value={real(row?.wind_speed, ' km/h')}
          source="weather_snapshots"
        />
        <Tile
          icon={Compass}
          label="Wind Direction"
          value={real(row?.wind_direction, '°')}
          source="weather_snapshots"
        />
        <Tile
          icon={Waves}
          label="Wave Height"
          value={real(row?.wave_height, ' m')}
          source="weather_snapshots"
        />
        <Tile
          icon={Thermometer}
          label="Temperature"
          value={real(row?.temperature, '°C')}
          source="weather_snapshots"
        />
      </div>
      <p className="mt-3 text-[10px] text-emerald-500/80">
        real · latest <code>weather_snapshots</code> row (wave height from
        Open-Meteo Marine; wind speed/direction &amp; temperature from
        Open-Meteo Forecast — two different upstream endpoints merged into
        one row)
      </p>
    </Card>
  )
}

function Tile({ icon: Icon, label, value, source }) {
  return (
    <div className="bg-[#0b1322] border border-[#1e293b] rounded-lg p-3">
      <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <Icon size={13} />
        {label}
      </span>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
      <div className="text-[10px] text-emerald-500/80">real · {source}</div>
    </div>
  )
}
