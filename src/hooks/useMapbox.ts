import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

export function useMapbox(containerId: string, style: string, center = [-120.5, 44.0] as [number, number], zoom = 5) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (mapRef.current) return

    mapRef.current = new mapboxgl.Map({ container: containerId, style, center, zoom })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapRef.current.addControl(new mapboxgl.ScaleControl({ maxWidth: 150, unit: 'imperial' }))

    function onLoad() { setReady(true) }
    function onError(e: any) {
      if (e?.error?.status || e?.error?.message) console.warn(`Map error: ${e.error.status || ''} ${e.error.message || ''}`)
    }

    mapRef.current.on('load', onLoad)
    mapRef.current.on('error', onError)

    return () => {
      mapRef.current?.off('load', onLoad)
      mapRef.current?.off('error', onError)
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [containerId, style, center.toString(), zoom])

  return { map: mapRef.current, ready }
}