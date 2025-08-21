import type mapboxgl from "mapbox-gl";

export class PitchControl implements mapboxgl.IControl {
  private _container!: HTMLElement;
  private _button!: HTMLButtonElement;
  private _map!: mapboxgl.Map;
  private _isTransitioning: boolean = false;

  onAdd(map: mapboxgl.Map): HTMLElement {
    this._map = map;

    const container = document.createElement("div");
    container.className = "mapboxgl-ctrl";

    // Main button
    this._button = document.createElement("button");
    this._button.className = "pitch-btn";
    this._button.type = "button";
    this._button.title = "Toggle 3D View";
    this._button.textContent = "3D";

    // Add event listeners
    this._button.addEventListener("click", this._onButtonClick.bind(this));

    // Listen for map pitch changes to update button state
    this._map.on("pitch", this._onPitchChange.bind(this));

    // Check initial pitch state and set button accordingly
    const initialPitch = this._map.getPitch();
    if (initialPitch > 0) {
      this._button.classList.add("pitch-btn--3d");
      this._button.title = "Switch to Top-Down View";
    }

    container.appendChild(this._button);
    this._container = container;

    return container;
  }

  onRemove(): void {
    this._container.remove();
  }

  getDefaultPosition() {
    return "top-right" as const;
  }

  private _onButtonClick(): void {
    if (this._isTransitioning) return;

    const currentPitch = this._map.getPitch();
    const targetPitch = currentPitch === 0 ? 60 : 0;

    this._isTransitioning = true;
    this._button.disabled = true;

    this._map.easeTo({
      pitch: targetPitch,
      duration: 800,
      easing: (t: number) => t * (2 - t), // ease-out
    });

    setTimeout(() => {
      this._isTransitioning = false;
      this._button.disabled = false;
    }, 800);
  }

  private _onPitchChange(): void {
    const currentPitch = this._map.getPitch();
    const is3D = currentPitch > 0;

    if (is3D) {
      this._button.classList.add("pitch-btn--3d");
      this._button.title = "Switch to Top-Down View";
    } else {
      this._button.classList.remove("pitch-btn--3d");
      this._button.title = "Switch to 3D View";
    }
  }
}
