import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { CUSTOM_STYLE_OVERRIDES } from '../config'

export function useMapbox(containerId: string, style: string, center = [-120.5, 44.0] as [number, number], zoom = 5) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (mapRef.current) return

    mapRef.current = new mapboxgl.Map({ container: containerId, style, center, zoom })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapRef.current.addControl(new mapboxgl.ScaleControl({ maxWidth: 150, unit: 'imperial' }))

    function onLoad() { 
      setReady(true)
      
      // Apply custom style color overrides
      if (mapRef.current) {
        applyCustomStyleColors(mapRef.current)
      }
    }
    
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

// Function to apply custom style colors
function applyCustomStyleColors(map: mapboxgl.Map) {
  try {
    const colors = CUSTOM_STYLE_OVERRIDES;
    const style = map.getStyle();
    
    if (style.layers) {
      style.layers.forEach(layer => {
        const layerId = layer.id;
        
        // Only tone down the bright greens, keep everything else as-is
        if (layer.type === 'fill') {
          if (layerId.includes('natural') || layerId.includes('landuse') || 
              layerId.includes('park') || layerId.includes('forest')) {
            map.setPaintProperty(layerId, 'fill-color', colors.natural);
          }
        }
      });
    }
    
    console.log('Green colors toned down successfully');
  } catch (error) {
    console.warn('Error applying custom style colors:', error);
  }
}