import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { CUSTOM_STYLE_OVERRIDES } from "../config";

export function useMapbox(
  containerId: string,
  style: string,
  center = [-121.5, 44.5] as [number, number], // More centered on Oregon
  zoom = 6.5 // Closer zoom to Oregon
) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerId,
      style,
      center,
      zoom,
      pitch: 50, // Higher pitch for a stronger 3D perspective
      bearing: 0,
    });

    mapRef.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
    mapRef.current.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      "top-right"
    );
    mapRef.current.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 150, unit: "imperial" })
    );

    function onLoad() {
      setReady(true);

      // Add 3D terrain
      if (mapRef.current) {
        mapRef.current.addSource("mapbox-terrain", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });

        // Add the DEM source as a terrain layer with consistent exaggeration across zooms
        mapRef.current.setTerrain({
          source: "mapbox-terrain",
          exaggeration: 2.0,
        });

        // Add sky layer for enhanced 3D effect
        mapRef.current.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun": [0.0, 0.0],
            "sky-atmosphere-sun-intensity": 15,
          },
        });

        // Add lighting for enhanced 3D terrain visualization
        mapRef.current.setLight({
          anchor: "map", // Keep sun fixed relative to map for consistent shading
          color: "white",
          intensity: 0.7, // Boosted intensity for more pronounced shading
          position: [1.5, 210, 80],
        });

        // Apply custom style color overrides
        applyCustomStyleColors(mapRef.current);
      }
    }

    function onError(e: any) {
      if (e?.error?.status || e?.error?.message)
        console.warn(
          `Map error: ${e.error.status || ""} ${e.error.message || ""}`
        );
    }

    mapRef.current.on("load", onLoad);
    mapRef.current.on("error", onError);

    return () => {
      mapRef.current?.off("load", onLoad);
      mapRef.current?.off("error", onError);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [containerId, style, center.toString(), zoom]);

  return { map: mapRef.current, ready };
}

// Function to apply custom style colors
function applyCustomStyleColors(map: mapboxgl.Map) {
  try {
    const colors = CUSTOM_STYLE_OVERRIDES;
    const style = map.getStyle();

    if (style.layers) {
      style.layers.forEach((layer) => {
        const layerId = layer.id;

        // Only tone down the bright greens, keep everything else as-is
        if (layer.type === "fill") {
          if (
            layerId.includes("natural") ||
            layerId.includes("landuse") ||
            layerId.includes("park") ||
            layerId.includes("forest")
          ) {
            map.setPaintProperty(layerId, "fill-color", colors.natural);
          }
        }
      });
    }

    console.log("Green colors toned down successfully");
  } catch (error) {
    console.warn("Error applying custom style colors:", error);
  }
}
