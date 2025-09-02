import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useMapbox } from "../hooks/useMapbox";
import { MAPBOX_STYLE_URL } from "../config";
import { LegendControl } from "./controls/LegendControl";
import { SurveyControl } from "./controls/SurveyControl";
import { PitchControl } from "./controls/PitchControl";
import { SourcesControl } from "./controls/SourcesControl";
import { SearchControl } from "./controls/SearchControl";

//layers
import {
  RoadlessLayer,
  PCTLayer,
  OregonTrailsLayer,
  CongressionalDistrictsLayer,
} from "./layers";

import MapTitle from "./MapTitle";
import Logos from "./Logos";
import ttLogo from "../assets/logos/tetontopo_logo.png";
import partnerLogo from "../assets/logos/SC-Oregon-Chapter-Logo_Horizontal_Color.png";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

export default function MapView() {
  const [note, setNote] = useState("Loading…");
  const noteRef = useRef<HTMLDivElement | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(
    null
  );

  const { map, ready } = useMapbox("map", MAPBOX_STYLE_URL);

  // Attach custom controls once
  useEffect(() => {
    if (!ready || !map) return;
    const m = map as mapboxgl.Map;
    m.addControl(new PitchControl(), "top-right");
    m.addControl(new SurveyControl(), "bottom-right");
    m.addControl(new LegendControl(), "bottom-right");
  }, [ready, map]);

  // Add sources/layers + behavior
  useEffect(() => {
    if (!ready || !map) return;

    const m = map as mapboxgl.Map;
    setNote("Basemap loaded. Adding sources + layers…");

    setNote(
      "Layers added. Popups enabled with live Acres and trail information."
    );

    return () => {
      // Cleanup will be handled by individual layer components
    };
  }, [ready, map]);

  return (
    <div className="map-root">
      <div id="map" />
      {/*Map title overlay*/}
      <MapTitle title="Oregon Roadless Areas" />

      {/* Search Control */}
      <SearchControl position="top-left" map={map} />

      {/* Sources Control */}
      <SourcesControl position="bottom-left" />

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
      {ready && map && (
        <>
          <RoadlessLayer map={map} ready={ready} />
          <PCTLayer map={map} ready={ready} />
          <OregonTrailsLayer map={map} ready={ready} />
          <CongressionalDistrictsLayer
            map={map}
            ready={ready}
            selectedDistrictId={selectedDistrictId}
            setSelectedDistrictId={setSelectedDistrictId}
          />
        </>
      )}
    </div>
  );
}
