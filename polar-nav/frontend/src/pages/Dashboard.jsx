import { useOutletContext } from 'react-router-dom'
import { Ship } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import AntarcticMap from '../components/AntarcticMap'
import MapSwitcher from '../components/MapSwitcher'
import WeatherPanel from '../components/WeatherPanel'

export default function Dashboard() {
  const { ships, shipsCount, positions, icebergs, status } = useOutletContext()

  return (
    <div className="p-3 h-full flex flex-col gap-3">
      <div className="max-w-xs shrink-0">
        <KpiCard
          icon={Ship}
          label="Total Vessels"
          value={status === 'loading' ? '…' : (shipsCount ?? ships.length)}
          sub="from ships table"
          subClass="text-emerald-500/80"
        />
      </div>

      <div className="shrink-0">
        <MapSwitcher />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-3 flex-1 min-h-0">
        <section className="relative rounded-xl overflow-hidden border border-[#1e293b] min-h-[320px]">
          <AntarcticMap ships={ships} positions={positions} icebergs={icebergs} />
        </section>

        <div className="flex flex-col gap-3 overflow-y-auto">
          <WeatherPanel />
        </div>
      </div>
    </div>
  )
}
