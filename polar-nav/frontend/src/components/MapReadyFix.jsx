import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

/**
 * Leaflet measures its container once at construction and never re-checks.
 * If the container's actual box changes size later for any reason — a
 * hidden/shown tab, a sibling element growing after async data loads, a
 * flex/grid row being stretched, or the browser window itself changing
 * size — Leaflet doesn't know unless told. A ResizeObserver on the map's
 * own container catches the first three; an explicit window "resize"
 * listener covers the window case directly. Render this once as a child
 * of <MapContainer>.
 */
export default function MapReadyFix() {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()

    const container = map.getContainer()
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(container)

    const onWindowResize = () => map.invalidateSize()
    window.addEventListener('resize', onWindowResize)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onWindowResize)
    }
  }, [map])
  return null
}
