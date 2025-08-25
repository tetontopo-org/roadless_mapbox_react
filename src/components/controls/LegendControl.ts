import type mapboxgl from "mapbox-gl";
import {
  OVERLAY_COLOR,
  FILL_OPACITY,
  PCT_COLOR,
  OREGON_TRAILS_COLOR,
  CONGRESSIONAL_DISTRICTS_COLOR,
} from "../../config";

export class LegendControl implements mapboxgl.IControl {
  private _container!: HTMLElement;

  onAdd(): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "mapboxgl-ctrl";
    const card = document.createElement("div");
    card.className = "legend-card";
    card.innerHTML = `
      <div class="legend-title">Legend</div>
      <div class="legend-item">
        <span class="legend-swatch" aria-hidden="true">
          <svg width="32" height="16" viewBox="0 0 32 16" xmlns="http://www.w3.org/2000/svg">
            <line x1="2" y1="8" x2="30" y2="8" stroke="${PCT_COLOR}" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 3" />
          </svg>
        </span>
        <span>PCT (Pacific Crest Trail)</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch" aria-hidden="true">
          <svg width="32" height="16" viewBox="0 0 32 16" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="28" height="12" fill="${OVERLAY_COLOR}" fill-opacity="${FILL_OPACITY}" stroke="${OVERLAY_COLOR}" stroke-width="1.5" />
          </svg>
        </span>
        <span>Roadless Area</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch" aria-hidden="true">
          <svg width="32" height="16" viewBox="0 0 32 16" xmlns="http://www.w3.org/2000/svg">
            <line x1="2" y1="8" x2="30" y2="8" stroke="${OREGON_TRAILS_COLOR}" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </span>
        <span>Oregon Trails</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch" aria-hidden="true">
          <svg width="32" height="16" viewBox="0 0 32 16" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="28" height="12" fill="${CONGRESSIONAL_DISTRICTS_COLOR}" fill-opacity="0.1" stroke="${CONGRESSIONAL_DISTRICTS_COLOR}" stroke-width="1.5" />
          </svg>
        </span>
        <span>Congressional Districts</span>
      </div>`;
    wrap.appendChild(card);
    this._container = wrap;
    return wrap;
  }

  onRemove(): void {
    this._container.remove();
  }

  getDefaultPosition() {
    return "bottom-right" as const;
  }
}
