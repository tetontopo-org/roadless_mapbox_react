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
        
        // Apply colors based on layer type and content
        switch (layer.type) {
          case 'background':
            map.setPaintProperty(layerId, 'background-color', colors.land);
            break;
            
          case 'fill':
            if (layerId.includes('water') || layerId.includes('ocean')) {
              map.setPaintProperty(layerId, 'fill-color', colors.water);
            } else if (layerId.includes('landuse') || layerId.includes('natural')) {
              map.setPaintProperty(layerId, 'fill-color', colors.natural);
            }
            break;
            
          case 'line':
            if (layerId.includes('water') || layerId.includes('waterway')) {
              map.setPaintProperty(layerId, 'line-color', colors.waterway);
            } else if (layerId.includes('road')) {
              const isSecondary = layerId.includes('secondary') || layerId.includes('tertiary');
              map.setPaintProperty(layerId, 'line-color', isSecondary ? colors['road-secondary'] : colors.road);
            } else if (layerId.includes('building')) {
              map.setPaintProperty(layerId, 'line-color', colors.building);
            }
            break;
            
          case 'symbol':
            map.setPaintProperty(layerId, 'text-color', colors.text);
            map.setPaintProperty(layerId, 'text-halo-color', colors['text-halo']);
            break;
        }
      });
    }
    
    console.log('Custom style colors applied successfully');
  } catch (error) {
    console.warn('Error applying custom style colors:', error);
  }
}