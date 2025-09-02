import { useEffect, useRef } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import { LayerComponentProps } from "./layerTypes";
import { CONGRESSIONAL_DISTRICTS_COLOR } from "../../config";

interface CongressionalDistrictsLayerProps extends LayerComponentProps {
  selectedDistrictId: string | null;
  setSelectedDistrictId: (id: string | null) => void;
}

export const CongressionalDistrictsLayer: React.FC<
  CongressionalDistrictsLayerProps
> = ({ map, ready, selectedDistrictId, setSelectedDistrictId }) => {
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!ready || !map) return;

    // Add congressional districts source
    if (!map.getSource("congressional-districts")) {
      map.addSource("congressional-districts", {
        type: "geojson",
        data: "/data/OR_Congressional_Districts.geojson",
        generateId: true,
      });
    }

    // Add congressional districts line layer
    if (!map.getLayer("congressional-districts-line")) {
      map.addLayer({
        id: "congressional-districts-line",
        type: "line",
        source: "congressional-districts",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": CONGRESSIONAL_DISTRICTS_COLOR,
          "line-opacity": 0.8,
          "line-width": 1.5,
          "line-translate": [0, 0],
          "line-translate-anchor": "map",
        },
      });
    }

    // Add congressional districts fill layer
    if (!map.getLayer("congressional-districts-fill")) {
      map.addLayer(
        {
          id: "congressional-districts-fill",
          type: "fill",
          source: "congressional-districts",
          maxzoom: 8,
          paint: {
            "fill-color": CONGRESSIONAL_DISTRICTS_COLOR,
            "fill-opacity": 0.1,
            "fill-translate": [0, 0],
            "fill-translate-anchor": "map",
          },
        },
        "congressional-districts-line"
      );
    }

    // Create popup
    popupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
    });

    // Clear district selection when popup is closed
    popupRef.current.on("close", () => {
      setSelectedDistrictId(null);
    });

    // Event handlers
    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    // General click handler for layer precedence
    const generalClickHandler = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point);

      // Define layer priority (higher index = higher priority)
      const layerPriority = [
        "congressional-districts-fill", // Lowest priority - clickable area
        "congressional-districts-line", // District boundaries
        "roadless-fill",
        "oregon-trails-line",
        "pct-line",
      ];

      // Find the highest priority feature
      let highestPriorityFeature = null;
      let highestPriorityIndex = -1;

      for (const feature of features) {
        const layerId = feature.layer?.id;
        if (layerId) {
          const priorityIndex = layerPriority.indexOf(layerId);
          if (priorityIndex > highestPriorityIndex) {
            highestPriorityIndex = priorityIndex;
            highestPriorityFeature = feature;
          }
        }
      }

      // If congressional districts (fill or line) is the highest priority, handle it
      if (
        highestPriorityFeature &&
        (highestPriorityFeature.layer?.id === "congressional-districts-line" ||
          highestPriorityFeature.layer?.id === "congressional-districts-fill")
      ) {
        const props = (highestPriorityFeature.properties || {}) as Record<
          string,
          any
        >;

        // Set the selected district ID for visual feedback
        const selectedDistrictNumber = props.DISTRICT || null;
        setSelectedDistrictId(selectedDistrictNumber);

        const representativeNameRaw =
          props.LISTING_NA || "Unknown Representative";
        const districtNumber = props.DISTRICT || "Unknown";
        const party = props.Party || "Unknown";
        const totalAcres = props.Acres
          ? props.Acres.toLocaleString("en-US")
          : "—";
        const roadlessAcres = props.SUM_RoadlessAreasAcres
          ? props.SUM_RoadlessAreasAcres.toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })
          : "—";

        // Parse "Last, First" format and convert to "First Last"
        let formattedRepresentativeName = "Unknown Representative";
        if (representativeNameRaw !== "Unknown Representative") {
          const nameParts = representativeNameRaw.split(", ");
          if (nameParts.length === 2) {
            const lastName = nameParts[0];
            const firstName = nameParts[1];
            formattedRepresentativeName = `${firstName} ${lastName}`;
          } else {
            formattedRepresentativeName = representativeNameRaw;
          }
        }

        // Format the representative name as "Rep. First Last (Party–OR-##)"
        const formattedName = `Rep. ${formattedRepresentativeName} (${party}–OR-${districtNumber.padStart(
          2,
          "0"
        )})`;

        const popupHTML = `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; color: #0b1f44; font-size: 16px;">Congressional District ${districtNumber}</h3>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;"><strong>Representative:</strong></p>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${formattedName}</p>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;"><strong>Total Area:</strong> ${totalAcres} acres</p>
            <p style="margin: 0; color: #666; font-size: 12px;"><strong>Roadless Areas:</strong> ${roadlessAcres} acres</p>
          </div>
        `;

        if (popupRef.current) {
          popupRef.current.setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
        }
      } else {
        // Clear selection when clicking elsewhere
        setSelectedDistrictId(null);
      }
    };

    // Add event listeners
    map.on("mouseenter", "congressional-districts-line", onEnter);
    map.on("mouseleave", "congressional-districts-line", onLeave);
    map.on("mouseenter", "congressional-districts-fill", onEnter);
    map.on("mouseleave", "congressional-districts-fill", onLeave);
    map.on("click", generalClickHandler);

    // Cleanup function
    return () => {
      map.off("mouseenter", "congressional-districts-line", onEnter);
      map.off("mouseleave", "congressional-districts-line", onLeave);
      map.off("mouseenter", "congressional-districts-fill", onEnter);
      map.off("mouseleave", "congressional-districts-fill", onLeave);
      map.off("click", generalClickHandler);

      if (popupRef.current) {
        popupRef.current.remove();
      }
    };
  }, [ready, map, setSelectedDistrictId]);

  // Update styling when selected district changes
  useEffect(() => {
    if (!ready || !map) return;

    const currentZoom = map.getZoom();

    // Only apply visual feedback when fill layer is visible (zoom <= 8)
    if (currentZoom <= 8) {
      // Update the congressional districts fill layer
      if (map.getLayer("congressional-districts-fill")) {
        if (selectedDistrictId) {
          map.setPaintProperty("congressional-districts-fill", "fill-opacity", [
            "case",
            ["==", ["get", "DISTRICT"], selectedDistrictId],
            0.4, // Darker when selected
            0.1, // Very light shading when not selected
          ]);
        } else {
          map.setPaintProperty(
            "congressional-districts-fill",
            "fill-opacity",
            0.1
          );
        }
      }

      // Update the congressional districts line layer
      if (map.getLayer("congressional-districts-line")) {
        if (selectedDistrictId) {
          map.setPaintProperty("congressional-districts-line", "line-opacity", [
            "case",
            ["==", ["get", "DISTRICT"], selectedDistrictId],
            1.0, // Fully opaque when selected
            0.8, // Normal opacity when not selected
          ]);

          map.setPaintProperty("congressional-districts-line", "line-width", [
            "case",
            ["==", ["get", "DISTRICT"], selectedDistrictId],
            2.5, // Thicker when selected
            1.5, // Normal width when not selected
          ]);
        } else {
          map.setPaintProperty(
            "congressional-districts-line",
            "line-opacity",
            0.8
          );
          map.setPaintProperty(
            "congressional-districts-line",
            "line-width",
            1.5
          );
        }
      }
    } else {
      // When zoom > 8, reset to default styling
      if (map.getLayer("congressional-districts-fill")) {
        map.setPaintProperty(
          "congressional-districts-fill",
          "fill-opacity",
          0.1
        );
      }
      if (map.getLayer("congressional-districts-line")) {
        map.setPaintProperty(
          "congressional-districts-line",
          "line-opacity",
          0.8
        );
        map.setPaintProperty("congressional-districts-line", "line-width", 1.5);
      }
    }
  }, [selectedDistrictId, ready, map]);

  return null;
};
