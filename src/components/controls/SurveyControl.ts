import type mapboxgl from "mapbox-gl";

export class SurveyControl implements mapboxgl.IControl {
  private _container!: HTMLElement;

  onAdd(): HTMLElement {
    const container = document.createElement("div");
    container.className = "survey-control";
    const a = document.createElement("a");
    a.className = "survey-btn";
    a.href = "https://act.sierraclub.org/actions/National?actionId=AR0569577";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Take Action";
    container.appendChild(a);
    this._container = container;
    return container;
  }

  onRemove(): void {
    this._container.remove();
  }

  getDefaultPosition() {
    return "bottom-right" as const;
  }
}
