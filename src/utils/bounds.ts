import mapboxgl from "mapbox-gl";

export async function getTileJSONBounds(tileset: string, token: string) {
  try {
    const url = `https://api.mapbox.com/v4/${tileset}.json?secure&access_token=${token}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`TileJSON HTTP ${r.status}`);
    const tj = await r.json();
    return {
      bounds: tj.bounds as [number, number, number, number] | null,
      center: tj.center as number[] | null,
    };
  } catch (err) {
    console.warn(`Bounds lookup failed for ${tileset}:`, err);
    return { bounds: null, center: null };
  }
}

export function unionBounds(
  a: [number, number, number, number] | null | undefined,
  b: [number, number, number, number] | null | undefined
) {
  if (!a) return b || null;
  if (!b) return a;
  const [aw, as, ae, an] = a;
  const [bw, bs, be, bn] = b;
  return [
    Math.min(aw, bw),
    Math.min(as, bs),
    Math.max(ae, be),
    Math.max(an, bn),
  ] as [number, number, number, number];
}

export function fitBounds(
  map: mapboxgl.Map,
  b: [number, number, number, number]
) {
  const [w, s, e, n] = b;
  map.fitBounds(
    [
      [w, s],
      [e, n],
    ],
    {
      padding: 40,
      duration: 0,
      pitch: 60, // Maintain 3D perspective
      bearing: 0,
    }
  );
}
