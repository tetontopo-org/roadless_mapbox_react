export const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/outdoors-v12';

// Subtle customizations to tone down the bright greens in outdoors basemap
export const CUSTOM_STYLE_OVERRIDES = {
  // Just tone down the intense greens to be more neutral
 'natural': '#a8bfa8',   // Muted sage green
'landuse': '#c3d6c3',   // Soft gray-green
'park':    '#9fb89f',   // Gentle mid-tone green
'forest':  '#8aa08a'    // Subdued olive green
};

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