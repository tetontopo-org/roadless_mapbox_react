import { Map } from "mapbox-gl";

export interface LayerComponentProps {
  map: Map;
  ready: boolean;
}

export interface LayerComponent {
  addLayer: () => void;
  removeLayer: () => void;
  addEventListeners: () => void;
  removeEventListeners: () => void;
}
