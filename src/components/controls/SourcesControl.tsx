import React, { useState, useEffect, useRef } from "react";

interface SourcesControlProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export const SourcesControl: React.FC<SourcesControlProps> = ({
  position = "top-right",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        buttonRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close popup when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  const closePopup = () => {
    setIsOpen(false);
  };

  return (
    <div className={`sources-control sources-control--${position}`}>
      <button
        ref={buttonRef}
        className={`sources-btn ${isOpen ? "sources-btn--active" : ""}`}
        onClick={togglePopup}
        title="Data Sources"
        type="button"
      >
        Sources
      </button>

      {isOpen && (
        <div ref={popupRef} className="sources-popup sources-popup--open">
          <div className="sources-popup-header">
            <h3>Data Sources</h3>
            <button
              className="sources-popup-close"
              onClick={closePopup}
              type="button"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="sources-popup-content">
            <p>
              This map was prepared by Tetontopo, in collaboration with the
              Sierra Club Oregon Chapter. This version was revised on
              2025/08/24. Data from:
            </p>
            <ul>
              <li>
                <a
                  href="https://databasin.org/maps/3c40f2a203eb4d529238da3548441d93/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  USDA Forest Service (USFS Inventoried Roadless Areas for
                  contiguous US)
                </a>
              </li>
              <li>
                <a
                  href="https://data-usfs.hub.arcgis.com/datasets/usfs::national-forest-system-trails-feature-layer/about"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  U.S. Forest Service (National Forest System Trails)
                </a>
              </li>
              <li>
                <a
                  href="https://www.pcta.org/discover-the-trail/maps/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pacific Crest Trail Association (Pacific Crest Trail
                  Centerline)
                </a>
              </li>
              <li>
                <a
                  href="https://hub.arcgis.com/datasets/usdot::congressional-districts/about"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  U.S. Department of Transportation (Congressional Districts)
                </a>
              </li>
            </ul>
            <p>
              The data provided in this image is for informational purposes
              only. It is not intended to be used for navigation, description,
              conveyance, authoritative definitions of legal boundaries, or
              property title. This is not a survey product. TetonTopo makes no
              warranty or representation, or guaranty as to the content,
              accuracy or completeness of the information provided herein.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
