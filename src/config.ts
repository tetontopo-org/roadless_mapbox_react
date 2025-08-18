export const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/outdoors-v12';

// Custom style overrides for Mapbox outdoors style
export const CUSTOM_STYLE_OVERRIDES = {
  // Land and terrain colors
  'land': '#f4f4f4',           // Light gray for land
  'landuse': '#e8e8e8',        // Urban areas
  'natural': '#d4e6d4',        // Natural areas (parks, forests)
  
  // Water colors
  'water': '#4a90e2',          // Blue for water bodies
  'waterway': '#2d5aa0',       // Rivers and streams
  
  // Road colors
  'road': '#ffffff',           // White for major roads
  'road-secondary': '#f0f0f0', // Secondary roads
  
  // Building colors
  'building': '#d1d1d1',       // Building outlines
  
  // Text colors
  'text': '#333333',           // Dark text for readability
  'text-halo': '#ffffff'       // Text halo/outline
};

// Alternative color schemes you can use
export const COLOR_SCHEMES = {
  // Earthy/natural theme
  earth: {
    land: '#f5f5dc',           // Beige
    water: '#87ceeb',          // Sky blue
    road: '#f0f8ff',           // Alice blue
    natural: '#90ee90',        // Light green
    building: '#d2b48c'        // Tan
  },
  
  // High contrast theme
  highContrast: {
    land: '#ffffff',            // White
    water: '#000080',           // Navy
    road: '#000000',            // Black
    natural: '#228b22',         // Forest green
    building: '#696969'         // Dim gray
  },
  
  // Warm theme
  warm: {
    land: '#faf0e6',            // Linen
    water: '#4682b4',           // Steel blue
    road: '#fff8dc',            // Cornsilk
    natural: '#daa520',         // Goldenrod
    building: '#cd853f'         // Peru
  }
};

// Function to get custom colors with optional scheme
export function getCustomColors(scheme?: keyof typeof COLOR_SCHEMES) {
  if (!scheme) {
    return CUSTOM_STYLE_OVERRIDES;
  }
  return COLOR_SCHEMES[scheme];
}

// Tilesets + source-layer names
export const ROADLESS_TILESET_ID   = 'tetontopo.34pdvs6z';
export const ROADLESS_SOURCE_LAYER = 'Roadless_areas-23lokp';

export const PCT_TILESET_ID        = 'tetontopo.993iycea';
export const PCT_SOURCE_LAYER      = 'PacificCrestTrail-b76ecu';

// Styling
export const OVERLAY_COLOR = '#b91c1c';
export const FILL_OPACITY  = 0.55;
export const PCT_COLOR     = '#0b5d1e';

// Field guesses for popup
export const ID_KEYS   = ['roadless_id','UID','ID','OBJECTID','FID','unique_id','id'] as const;
export const NAME_KEYS = ['Roadless_Name','Name','NAME','name','UnitName','unit_name','RoadlessName'] as const;