// Lightweight equirectangular projection + Gulf coastline reference geometry.
// The map renderer is deliberately provider-agnostic: an Azure Maps control can
// replace it without changing the layer model or interaction contract.

export interface Viewport {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
  width: number;
  height: number;
}

export const GULF_VIEW: Omit<Viewport, "width" | "height"> = {
  minLon: -97.6,
  maxLon: -83.6,
  minLat: 24.0,
  maxLat: 31.6,
};

export function project(lon: number, lat: number, v: Viewport): [number, number] {
  const x = ((lon - v.minLon) / (v.maxLon - v.minLon)) * v.width;
  const y = ((v.maxLat - lat) / (v.maxLat - v.minLat)) * v.height;
  return [x, y];
}

/** Miles → pixels at the viewport's mean latitude. */
export function milesToPx(miles: number, v: Viewport): number {
  const degPerMileLon = 1 / (69 * Math.cos((((v.minLat + v.maxLat) / 2) * Math.PI) / 180));
  return (miles * degPerMileLon * v.width) / (v.maxLon - v.minLon);
}

/** Approximate northern Gulf of Mexico coastline, west to east. */
export const GULF_COAST: Array<[number, number]> = [
  [-97.5, 24.0],
  [-97.6, 25.9],
  [-97.3, 26.6],
  [-97.2, 27.8],
  [-96.8, 28.2],
  [-96.0, 28.6],
  [-95.3, 28.9],
  [-94.7, 29.3],
  [-94.2, 29.5],
  [-93.8, 29.6],
  [-93.3, 29.75],
  [-92.6, 29.6],
  [-92.0, 29.55],
  [-91.4, 29.25],
  [-90.9, 29.15],
  [-90.3, 29.05],
  [-89.6, 28.95],
  [-89.1, 28.95],
  [-89.0, 29.4],
  [-89.35, 29.75],
  [-89.9, 30.15],
  [-88.9, 30.35],
  [-88.1, 30.35],
  [-87.4, 30.3],
  [-86.6, 30.4],
  [-85.7, 29.95],
  [-84.9, 29.7],
  [-84.3, 30.1],
  [-83.9, 29.9],
  [-83.6, 29.5],
];

export function coastPath(v: Viewport): string {
  const pts = GULF_COAST.map(([lon, lat]) => project(lon, lat, v));
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return `${d} L${v.width},0 L0,0 Z`;
}

export function coastLine(v: Viewport): string {
  return GULF_COAST.map(([lon, lat], i) => {
    const [x, y] = project(lon, lat, v);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}
