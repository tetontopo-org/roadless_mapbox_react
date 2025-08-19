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
} from "../config";
import { getTileJSONBounds, unionBounds, fitBounds } from "../utils/bounds";
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
    if (!m.getSource("roadless-src")) {
      m.addSource("roadless-src", {
        type: "vector",
        url: `mapbox://${ROADLESS_TILESET_ID}`,
      });
    }
    if (!m.getSource("pct")) {
      m.addSource("pct", {
        type: "geojson",
        data: "/data/pct_or_simplified.geojson", // from earlier step
        generateId: true,
      });
    }

    // Place below first symbol layer
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
          paint: { "fill-color": OVERLAY_COLOR, "fill-opacity": FILL_OPACITY },
        },
        firstSymbol
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
          paint: { "line-color": OVERLAY_COLOR, "line-width": 1.5 },
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

    m.on("mouseenter", "roadless-fill", onEnter);
    m.on("mouseleave", "roadless-fill", onLeave);
    m.on("click", "roadless-fill", onClick);

    setNote("Layers added. Popups enabled with live Acres.");

    // Fit to union of bounds
    (async () => {
      const token = (mapboxgl as any).accessToken as string;

      const [rMeta, pctBounds] = await Promise.all([
        getTileJSONBounds(ROADLESS_TILESET_ID, token),
        getGeoJSONBounds("/data/pct_simplified.geojson"), // local PCT
      ]);

      // rMeta.bounds is [minX, minY, maxX, maxY]
      const rBounds = rMeta?.bounds as
        | [number, number, number, number]
        | undefined;

      let ub: [number, number, number, number] | null = null;
      if (rBounds && pctBounds) {
        ub = unionBounds(rBounds, pctBounds);
      } else {
        ub = rBounds ?? pctBounds ?? null;
      }

      if (ub) {
        fitBounds(m, ub);
        setNote("View fit to union of Roadless + PCT bounds.");
      } else if (rMeta?.center && rMeta.center.length >= 2) {
        m.setCenter([rMeta.center[0], rMeta.center[1]]);
        if (rMeta.center.length >= 3) m.setZoom(rMeta.center[2]);
        setNote("Centered using Roadless center metadata.");
      }
    })();

    return () => {
      m.off("mouseenter", "roadless-fill", onEnter);
      m.off("mouseleave", "roadless-fill", onLeave);
      m.off("click", "roadless-fill", onClick);
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
