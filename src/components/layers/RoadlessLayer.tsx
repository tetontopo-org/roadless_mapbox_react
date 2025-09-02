import { useEffect, useRef } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import { LayerComponentProps } from "./layerTypes";
import {
  ROADLESS_TILESET_ID,
  ROADLESS_SOURCE_LAYER,
  OVERLAY_COLOR,
  FILL_OPACITY,
} from "../../config";
import { buildPopupHTML } from "../../utils/popup";
import * as turf from "@turf/turf";
import { ID_KEYS, NAME_KEYS } from "../../config";

export const RoadlessLayer: React.FC<LayerComponentProps> = ({
  map,
  ready,
}) => {
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!ready || !map) return;

    // Add source
    if (!map.getSource("roadless-src")) {
      map.addSource("roadless-src", {
        type: "vector",
        url: `mapbox://${ROADLESS_TILESET_ID}`,
      });
    }

    // Find first symbol layer for positioning
    const firstSymbol = map
      .getStyle()
      .layers?.find((l) => l.type === "symbol")?.id;

    // Add roadless fill layer
    if (!map.getLayer("roadless-fill")) {
      map.addLayer(
        {
          id: "roadless-fill",
          type: "fill",
          source: "roadless-src",
          "source-layer": ROADLESS_SOURCE_LAYER,
          filter: ["==", ["geometry-type"], "Polygon"],
          paint: {
            "fill-color": OVERLAY_COLOR,
            "fill-opacity": FILL_OPACITY,
            "fill-translate": [0, 0],
            "fill-translate-anchor": "map",
          },
        },
        firstSymbol
      );
    }

    // Add roadless outline layer
    if (!map.getLayer("roadless-line")) {
      map.addLayer(
        {
          id: "roadless-line",
          type: "line",
          source: "roadless-src",
          "source-layer": ROADLESS_SOURCE_LAYER,
          filter: [
            "any",
            ["==", ["geometry-type"], "LineString"],
            ["==", ["geometry-type"], "Polygon"],
          ],
          paint: {
            "line-color": OVERLAY_COLOR,
            "line-width": 1.5,
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

    const onClick = (e: mapboxgl.MapLayerMouseEvent) => {
      const f = e.features && e.features[0];
      if (!f || !popupRef.current) return;

      const props = (f.properties || {}) as Record<string, any>;
      const nameKey = NAME_KEYS.find((k) => props[k] !== undefined);
      const idKey = ID_KEYS.find((k) => props[k] !== undefined);
      const name = nameKey ? String(props[nameKey]) : "Unnamed area";
      const uid = idKey ? String(props[idKey]) : null;

      // Calculate area
      let acresTxt = "—";
      try {
        const gj = {
          type: "Feature",
          properties: {},
          geometry: f.geometry,
        } as any;
        const m2 = (turf.area as any)(gj);
        const acres = m2 / 4046.8564224;
        if (Number.isFinite(acres)) {
          acresTxt = acres.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          });
        }
      } catch {}

      popupRef.current
        .setLngLat(e.lngLat)
        .setHTML(buildPopupHTML(name, uid, acresTxt))
        .addTo(map);
    };

    // Add event listeners
    map.on("mouseenter", "roadless-fill", onEnter);
    map.on("mouseleave", "roadless-fill", onLeave);
    map.on("click", "roadless-fill", onClick);

    // Cleanup function
    return () => {
      map.off("mouseenter", "roadless-fill", onEnter);
      map.off("mouseleave", "roadless-fill", onLeave);
      map.off("click", "roadless-fill", onClick);

      if (popupRef.current) {
        popupRef.current.remove();
      }
    };
  }, [ready, map]);

  return null; // This component doesn't render anything
};
