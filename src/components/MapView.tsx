import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";
import { useMapbox } from "../hooks/useMapbox";
import {
  MAPBOX_STYLE_URL,
  ROADLESS_TILESET_ID,
  ROADLESS_SOURCE_LAYER,
  OVERLAY_COLOR,
  FILL_OPACITY,
  PCT_COLOR,
  ID_KEYS,
  NAME_KEYS,
  OREGON_TRAILS_COLOR,
} from "../config";
// Removed late fitBounds/easeTo imports to prevent post-load camera jump
import { buildPopupHTML } from "../utils/popup";
import { LegendControl } from "./controls/LegendControl";
import { SurveyControl } from "./controls/SurveyControl";

import MapTitle from "./MapTitle";

import Logos from "./Logos";
import ttLogo from "../assets/logos/tetontopo_logo.png";
import partnerLogo from "../assets/logos/SC-Oregon-Chapter-Logo_Horizontal_Color.png";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

export default function MapView() {
  const [note, setNote] = useState("Loading…");
  const noteRef = useRef<HTMLDivElement | null>(null);

  const { map, ready } = useMapbox("map", MAPBOX_STYLE_URL);

  // Attach custom controls once
  useEffect(() => {
    if (!ready || !map) return;
    const m = map as mapboxgl.Map; // <- capture non-null
    m.addControl(new SurveyControl(), "top-right");
    m.addControl(new LegendControl(), "bottom-right");
  }, [ready, map]);

  async function getGeoJSONBounds(
    url: string
  ): Promise<[number, number, number, number] | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const gj = await res.json();
      // Compute bbox via Turf
      const b = (turf.bbox as any)(gj) as [number, number, number, number];
      return b;
    } catch {
      return null;
    }
  }

  // Add sources/layers + behavior
  useEffect(() => {
    if (!ready || !map) return;

    const m = map as mapboxgl.Map; // <- capture non-null ONCE for this effect
    setNote("Basemap loaded. Adding sources + layers…");

    // Add sources
    // Note: Layers will be added above the 3D terrain that was set up in useMapbox

    //roadless source
    if (!m.getSource("roadless-src")) {
      m.addSource("roadless-src", {
        type: "vector",
        url: `mapbox://${ROADLESS_TILESET_ID}`,
      });
    }

    //pct source (local)
    if (!m.getSource("pct")) {
      m.addSource("pct", {
        type: "geojson",
        data: "/data/pct_or_simplified.geojson", // from earlier step
        generateId: true,
      });
    }

    // Trails source (local)
    if (!map.getSource("oregon-trails")) {
      map.addSource("oregon-trails", {
        type: "geojson",
        // If you placed your file under public/data/, this path will work at runtime
        data: "/data/Oregon_trails.geojson",
        // promoteId lets us reference a stable id in events/filters
        promoteId: "OBJECTID_1",
      });
    }

    //first symbol
    const firstSymbol = m
      .getStyle()
      .layers?.find((l) => l.type === "symbol")?.id;

    // Roadless fill
    if (!m.getLayer("roadless-fill")) {
      m.addLayer(
        {
          id: "roadless-fill",
          type: "fill",
          source: "roadless-src",
          "source-layer": ROADLESS_SOURCE_LAYER,
          filter: ["==", ["geometry-type"], "Polygon"],
          paint: {
            "fill-color": OVERLAY_COLOR,
            "fill-opacity": FILL_OPACITY,
            "fill-translate": [0, 0], // Ensure proper positioning on 3D terrain
            "fill-translate-anchor": "map",
          },
        },
        firstSymbol
      );
    }

    // --- Trails line layer ---
    if (!map.getLayer("oregon-trails-line")) {
      map.addLayer(
        {
          id: "oregon-trails-line",
          type: "line",
          source: "oregon-trails",
          minzoom: 10, // Show when scale is around 5 miles
          layout: {
            "line-cap": "round",
            "line-join": "round",
            // show only at appropriate zooms if you like:
            // "visibility": "visible"
          },
          paint: {
            "line-color": OREGON_TRAILS_COLOR,
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10,
              0.8,
              12,
              1.5,
              14,
              2.5,
              16,
              4,
            ],
            "line-opacity": 0.9,
            "line-translate": [0, 0], // Ensure proper positioning on 3D terrain
            "line-translate-anchor": "map",
          },
        },
        "roadless-fill" // Position above basemap but below roadless areas
      );
    }

    // Roadless outline
    if (!m.getLayer("roadless-line")) {
      m.addLayer(
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
            "line-translate": [0, 0], // Ensure proper positioning on 3D terrain
            "line-translate-anchor": "map",
          },
        },
        firstSymbol
      );
    }

    // PCT line (from local GeoJSON)
    if (!m.getLayer("pct-line")) {
      m.addLayer(
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
            "line-translate": [0, 0], // Ensure proper positioning on 3D terrain
            "line-translate-anchor": "map",
          },
        },
        firstSymbol
      );
    }

    // // Create one fixed label for the entire Oregon PCT
    // (async () => {
    //   const gj: any = await fetch("/data/pct_or_simplified.geojson").then((r) =>
    //     r.json()
    //   );

    //   // Find the geometric center of the whole trail
    //   const center = (turf.center(gj) as any).geometry.coordinates;

    //   const labelFC: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
    //     type: "FeatureCollection",
    //     features: [
    //       {
    //         type: "Feature",
    //         geometry: { type: "Point", coordinates: center },
    //         properties: {
    //           Label: "Pacific Crest Trail – Oregon",
    //         },
    //       },
    //     ],
    //   };

    //   if (!m.getSource("pct-label-src")) {
    //     m.addSource("pct-label-src", { type: "geojson", data: labelFC });
    //   } else {
    //     (m.getSource("pct-label-src") as mapboxgl.GeoJSONSource).setData(
    //       labelFC
    //     );
    //   }

    //   if (m.getLayer("pct-label")) m.removeLayer("pct-label");
    //   m.addLayer({
    //     id: "pct-label",
    //     type: "symbol",
    //     source: "pct-label-src",
    //     layout: {
    //       "text-field": ["get", "Label"],
    //       "text-size": 18,
    //       "text-allow-overlap": true, // ensure it's always visible
    //       "text-ignore-placement": true, // ignore collisions with other labels
    //       "text-font": ["Arial Unicode MS Regular"],
    //     },
    //     paint: {
    //       "text-color": "#0b1f44",
    //       "text-halo-color": "#ffffff",
    //       "text-halo-width": 2,
    //     },
    //   });
    // })();

    // Popups on roadless polygons
    const popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: true });

    function onEnter() {
      m.getCanvas().style.cursor = "pointer";
    }
    function onLeave() {
      m.getCanvas().style.cursor = "";
    }
    function onClick(e: mapboxgl.MapLayerMouseEvent) {
      const f = e.features && e.features[0];
      if (!f) return;
      const props = (f.properties || {}) as Record<string, any>;
      const nameKey = NAME_KEYS.find((k) => props[k] !== undefined);
      const idKey = ID_KEYS.find((k) => props[k] !== undefined);
      const name = nameKey ? String(props[nameKey]) : "Unnamed area";
      const uid = idKey ? String(props[idKey]) : null;

      // Area (m² -> acres)
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

      popup
        .setLngLat(e.lngLat)
        .setHTML(buildPopupHTML(name, uid, acresTxt))
        .addTo(m); // <- use m
    }

    // PCT and Oregon Trails click functionality
    function onTrailClick(e: mapboxgl.MapLayerMouseEvent) {
      const f = e.features && e.features[0];
      if (!f) return;
      const props = (f.properties || {}) as Record<string, any>;

      // Determine which trail layer was clicked by checking the source
      const sourceId = f.source;
      let trailName = "Unknown Trail";
      let trailInfo = "";

      if (sourceId === "pct") {
        trailName = "Pacific Crest Trail - Oregon";
        trailInfo =
          "A long-distance hiking trail spanning the length of Oregon";
      } else if (sourceId === "oregon-trails") {
        // Try to get trail name from properties
        trailName =
          props.TRAIL_NAME || props.NAME || props.TRAIL || "Oregon Trail";
        trailInfo = props.DESCRIPTION || "A trail in Oregon";

        // Check if this is a PCT segment
        if (props.TRAIL_NAME && props.TRAIL_NAME.includes("PACIFIC CREST")) {
          trailName = "Pacific Crest Trail - Oregon Section";
          trailInfo =
            "A long-distance hiking trail spanning from Canada to Mexico";
        }
      }

      // Get trail length from properties or calculate if not available
      let lengthTxt = "—";
      if (sourceId === "oregon-trails" && props.GIS_MILES) {
        // Use the pre-calculated GIS miles from the data
        lengthTxt =
          props.GIS_MILES.toLocaleString("en-US", {
            maximumFractionDigits: 1,
          }) + " miles";
      } else if (sourceId === "pct") {
        // For the dedicated PCT source, show the total Oregon PCT length
        lengthTxt = "456.5 miles (of 2,650 miles total)"; // Total Oregon PCT length
      } else {
        // Calculate length for other trails if GIS_MILES is not available
        try {
          const gj = {
            type: "Feature",
            properties: {},
            geometry: f.geometry,
          } as any;
          const lengthMeters = (turf.length as any)(gj);
          const lengthMiles = lengthMeters * 0.000621371; // Convert to miles
          if (Number.isFinite(lengthMiles)) {
            lengthTxt =
              lengthMiles.toLocaleString("en-US", {
                maximumFractionDigits: 1,
              }) + " miles";
          }
        } catch {}
      }

      const popupHTML = `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #0b1f44; font-size: 16px;">${trailName}</h3>
          <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${trailInfo}</p>
          <p style="margin: 0; color: #666; font-size: 12px;">Length: ${lengthTxt}</p>
        </div>
      `;

      popup.setLngLat(e.lngLat).setHTML(popupHTML).addTo(m);
    }

    m.on("mouseenter", "roadless-fill", onEnter);
    m.on("mouseleave", "roadless-fill", onLeave);
    m.on("click", "roadless-fill", onClick);

    // Add trail click functionality
    m.on("mouseenter", "pct-line", onEnter);
    m.on("mouseleave", "pct-line", onLeave);
    m.on("click", "pct-line", onTrailClick);

    m.on("mouseenter", "oregon-trails-line", onEnter);
    m.on("mouseleave", "oregon-trails-line", onLeave);
    m.on("click", "oregon-trails-line", onTrailClick);

    setNote(
      "Layers added. Popups enabled with live Acres and trail information."
    );

    // Removed delayed fit-to-bounds and easeTo to avoid post-load zoom jump

    return () => {
      m.off("mouseenter", "roadless-fill", onEnter);
      m.off("mouseleave", "roadless-fill", onLeave);
      m.off("click", "roadless-fill", onClick);
      m.off("mouseenter", "pct-line", onEnter);
      m.off("mouseleave", "pct-line", onLeave);
      m.off("click", "pct-line", onTrailClick);
      m.off("mouseenter", "oregon-trails-line", onEnter);
      m.off("mouseleave", "oregon-trails-line", onLeave);
      m.off("click", "oregon-trails-line", onTrailClick);
    };
  }, [ready, map]);

  return (
    <div className="map-root">
      <div id="map" />
      {/*Map title overlay*/}
      <MapTitle title="Oregon Roadless Areas" />
      {/* Logos overlay goes here */}
      <Logos
        position="bottom-center"
        gap={20}
        items={[
          { src: ttLogo, alt: "TetonTopo", href: "https://tetontopo.com" },
          {
            src: partnerLogo,
            alt: "Sierra Club Oregon Chapter",
            href: "https://www.sierraclub.org/oregon",
            height: 34,
            card: true,
          },
        ]}
      />

      {/* Existing note overlay */}
      <div ref={noteRef} className="note">
        {note}
      </div>
    </div>
  );
}
