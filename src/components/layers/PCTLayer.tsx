import { useEffect, useRef } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import { LayerComponentProps } from "./layerTypes";
import { PCT_COLOR } from "../../config";

export const PCTLayer: React.FC<LayerComponentProps> = ({ map, ready }) => {
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!ready || !map) return;

    // Add PCT source
    if (!map.getSource("pct")) {
      map.addSource("pct", {
        type: "geojson",
        data: "/data/pct_or_simplified.geojson",
        generateId: true,
      });
    }

    // Find first symbol layer for positioning
    const firstSymbol = map
      .getStyle()
      .layers?.find((l) => l.type === "symbol")?.id;

    // Add PCT line layer
    if (!map.getLayer("pct-line")) {
      map.addLayer(
        {
          id: "pct-line",
          type: "line",
          source: "pct",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": PCT_COLOR,
            "line-opacity": 0.98,
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              3,
              1.4,
              8,
              2.8,
              12,
              4.2,
              16,
              6.5,
              20,
              10,
            ],
            "line-dasharray": [
              "step",
              ["zoom"],
              ["literal", [2, 2]],
              10,
              ["literal", [3, 2]],
              16,
              ["literal", [4, 2]],
            ],
            "line-translate": [0, 0],
            "line-translate-anchor": "map",
          },
        },
        firstSymbol
      );
    }

    // Create popup
    popupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
    });

    // Event handlers
    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    const onTrailClick = (e: mapboxgl.MapLayerMouseEvent) => {
      if (!popupRef.current) return;

      const popupHTML = `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #0b1f44; font-size: 16px;">Pacific Crest Trail - Oregon</h3>
          <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">A long-distance hiking trail spanning the length of Oregon</p>
          <p style="margin: 0; color: #666; font-size: 12px;">Length: 456.5 miles (of 2,650 miles total)</p>
        </div>
      `;

      popupRef.current.setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
    };

    // Add event listeners
    map.on("mouseenter", "pct-line", onEnter);
    map.on("mouseleave", "pct-line", onLeave);
    map.on("click", "pct-line", onTrailClick);

    // Cleanup function
    return () => {
      map.off("mouseenter", "pct-line", onEnter);
      map.off("mouseleave", "pct-line", onLeave);
      map.off("click", "pct-line", onTrailClick);

      if (popupRef.current) {
        popupRef.current.remove();
      }
    };
  }, [ready, map]);

  return null;
};
