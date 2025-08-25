import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface SearchControlProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  map?: mapboxgl.Map | null;
}

interface GeocodingResult {
  id: string;
  place_name: string;
  center: [number, number];
  bbox?: [number, number, number, number];
  properties: {
    category?: string;
    maki?: string;
  };
}

export const SearchControl: React.FC<SearchControlProps> = ({
  position = "top-left",
  map,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleResultSelect(results[selectedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, results, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery.trim() || !map) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      // Use Mapbox Geocoding API with Oregon-focused search
      const params = new URLSearchParams({
        access_token: mapboxgl.accessToken,
        country: "US",
        types: "poi,place,address,neighborhood",
        limit: "8",
        bbox: "-125,42,-116,47", // Oregon bounding box
        proximity: "-120.5,44.5", // Center of Oregon for better results
        language: "en",
      });

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?${params}`
      );

      if (!response.ok) {
        throw new Error("Geocoding request failed");
      }

      const data = await response.json();
      setResults(data.features || []);
      setIsOpen(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim()) {
      // Debounce the search
      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(value);
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleResultSelect = (result: GeocodingResult) => {
    if (!map) return;

    const [lng, lat] = result.center;

    // Determine appropriate zoom level based on result type
    let zoom = 14;
    if (result.bbox) {
      // Calculate zoom based on bbox size
      const bbox = result.bbox;
      const width = Math.abs(bbox[2] - bbox[0]);
      const height = Math.abs(bbox[3] - bbox[1]);
      const maxDimension = Math.max(width, height);

      if (maxDimension > 1) zoom = 8; // Large area (state/county)
      else if (maxDimension > 0.1) zoom = 10; // Medium area (city)
      else if (maxDimension > 0.01) zoom = 12; // Small area (neighborhood)
      else zoom = 16; // Very small area (address)
    } else {
      // Default zoom based on result type
      const resultType = result.properties.category || "";
      if (resultType.includes("address")) zoom = 16;
      else if (resultType.includes("neighborhood")) zoom = 12;
      else if (resultType.includes("city")) zoom = 10;
      else zoom = 14;
    }

    // Show loading state
    setIsLoading(true);

    // Fly to the location
    map.flyTo({
      center: [lng, lat],
      zoom: zoom,
      duration: 2000,
    });

    // If there's a bbox, fit to it with padding
    if (result.bbox) {
      map.fitBounds(result.bbox as mapboxgl.LngLatBoundsLike, {
        padding: 50,
        duration: 2000,
      });
    }

    // Close dropdown and clear input
    setIsOpen(false);
    setSelectedIndex(-1);
    setQuery(result.place_name);

    // Hide loading state after animation
    setTimeout(() => {
      setIsLoading(false);
    }, 2100);
  };

  const getIconForCategory = (category?: string, maki?: string) => {
    if (maki) return maki;

    if (category?.includes("mountain")) return "mountain";
    if (category?.includes("river")) return "water";
    if (category?.includes("park")) return "park";
    if (category?.includes("city")) return "city";
    if (category?.includes("address")) return "marker";

    return "marker";
  };

  return (
    <div
      className={`search-control search-control--${position}`}
      ref={searchRef}
    >
      <div className="search-input-container">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search places, addresses, rivers, mountains..."
          className="search-input"
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        {isLoading && (
          <div className="search-loading">
            <div className="spinner"></div>
          </div>
        )}
        {query && !isLoading && (
          <button
            className="search-clear"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            type="button"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-results" ref={resultsRef}>
          {results.map((result, index) => (
            <div
              key={result.id}
              className={`search-result ${
                index === selectedIndex ? "search-result--selected" : ""
              }`}
              onClick={() => handleResultSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="search-result-icon">
                <span
                  className={`maki maki-${getIconForCategory(
                    result.properties.category,
                    result.properties.maki
                  )}`}
                ></span>
              </div>
              <div className="search-result-content">
                <div className="search-result-name">{result.place_name}</div>
                {result.properties.category && (
                  <div className="search-result-category">
                    {result.properties.category}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && query && !isLoading && (
        <div className="search-results">
          <div className="search-no-results">
            No results found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
};
