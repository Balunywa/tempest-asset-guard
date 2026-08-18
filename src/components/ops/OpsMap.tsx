import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, Crosshair } from "lucide-react";

import type { Asset, AssetRisk, WeatherEvent } from "@/lib/domain/types";
import {
  GULF_VIEW,
  PLACES,
  SHELF_EDGE,
  bathymetryBand,
  landPaths,
  milesToPx,
  polylinePath,
  project,
  scaleBar,
  shorelinePaths,
  type Viewport,
} from "@/lib/map/geo";
import { riskColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";

const W = 1400;
const H = 800;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

export type LayerState = Record<string, boolean>;

export interface OpsMapProps {
  assets: Asset[];
  risks: Map<string, AssetRisk>;
  event: WeatherEvent;
  layers: LayerState;
  selectedId?: string | null | undefined;
  highlightIds?: string[] | undefined;
  hour?: number | undefined;
  onSelect?: ((id: string) => void) | undefined;
  className?: string | undefined;
}

function interpolatePosition(event: WeatherEvent, hour: number) {
  const f = event.forecast;
  for (let i = 0; i < f.length - 1; i++) {
    const a = f[i]!;
    const b = f[i + 1]!;
    if (hour >= a.hour && hour <= b.hour) {
      const t = (hour - a.hour) / (b.hour - a.hour);
      return {
        lat: a.lat + (b.lat - a.lat) * t,
        lon: a.lon + (b.lon - a.lon) * t,
        windMph: Math.round(a.windMph + (b.windMph - a.windMph) * t),
        coneRadiusMi: a.coneRadiusMi + (b.coneRadiusMi - a.coneRadiusMi) * t,
        category: t < 0.5 ? a.category : b.category,
      };
    }
  }
  const last = f[f.length - 1]!;
  return {
    lat: last.lat,
    lon: last.lon,
    windMph: last.windMph,
    coneRadiusMi: last.coneRadiusMi,
    category: last.category,
  };
}

/** Saffir-Simpson colour ramp used on track points, as on NHC track charts. */
function categoryColor(category: number, windMph: number): string {
  if (category >= 5) return "var(--color-cat5)";
  if (category >= 4) return "var(--color-cat4)";
  if (category >= 3) return "var(--color-cat3)";
  if (category >= 2) return "var(--color-cat2)";
  if (category >= 1) return "var(--color-cat1)";
  if (windMph >= 39) return "var(--color-cat-ts)";
  return "var(--color-cat-td)";
}

function categoryLabel(category: number, windMph: number): string {
  if (category >= 1) return String(category);
  return windMph >= 39 ? "S" : "D";
}

function markerPath(type: Asset["type"], size: number): string {
  const s = size;
  switch (type) {
    case "offshore_platform":
      return `M${-s},${-s} L${s},${-s} L${s},${s} L${-s},${s} Z`;
    case "refinery":
      return `M${-s * 1.1},${s} L0,${-s * 1.1} L${s * 1.1},${s} Z`;
    case "lng_terminal":
      return `M0,${-s * 1.2} L${s * 1.2},0 L0,${s * 1.2} L${-s * 1.2},0 Z`;
    case "port":
      return `M${-s},${-s * 0.6} L${s},${-s * 0.6} L${s * 0.6},${s} L${-s * 0.6},${s} Z`;
    case "storage":
      return `M${-s * 0.9},${-s * 0.9} L${s * 0.9},${-s * 0.9} L${s * 0.9},${s * 0.9} L${-s * 0.9},${s * 0.9} Z`;
    default:
      return `M0,${-s * 0.85} L${s * 0.85},0 L0,${s * 0.85} L${-s * 0.85},0 Z`;
  }
}

const RISK_RANK: Record<string, number> = {
  normal: 0,
  monitor: 1,
  elevated: 2,
  high: 3,
  critical: 4,
};

export function OpsMap({
  assets,
  risks,
  event,
  layers,
  selectedId,
  highlightIds = [],
  hour = 0,
  onSelect,
  className,
}: OpsMapProps) {
  const v: Viewport = useMemo(() => ({ ...GULF_VIEW, width: W, height: H }), []);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);
  const [hovered, setHovered] = useState<{ asset: Asset; x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<{ lon: number; lat: number } | null>(null);

  const pos = interpolatePosition(event, hour);
  const highlight = new Set(highlightIds);

  // ---- cursor-anchored wheel zoom (native, non-passive) --------------------
  // All pan/zoom math runs in viewBox units; `baseScale` converts CSS px → units.
  const view = useRef({ zoom, pan });
  view.current = { zoom, pan };

  const metrics = useCallback(() => {
    const el = containerRef.current;
    const rect = el?.getBoundingClientRect() ?? new DOMRect(0, 0, W, H);
    const baseScale = Math.min(rect.width / W, rect.height / H) || 1;
    return { rect, baseScale };
  }, []);

  const clampPan = useCallback(
    (p: { x: number; y: number }, z: number) => {
      const { rect, baseScale } = metrics();
      const maxX = Math.max(0, (W * z) / 2 - rect.width / (2 * baseScale));
      const maxY = Math.max(0, (H * z) / 2 - rect.height / (2 * baseScale));
      return {
        x: Math.min(maxX, Math.max(-maxX, p.x)),
        y: Math.min(maxY, Math.max(-maxY, p.y)),
      };
    },
    [metrics],
  );

  /** `ux`/`uy`: anchor point relative to the map centre, in viewBox units. */
  const zoomAt = useCallback(
    (nextZoom: number, ux: number, uy: number) => {
      const { zoom: z, pan: p } = view.current;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
      const k = next / z;
      setZoom(next);
      setPan(clampPan({ x: ux * (1 - k) + k * p.x, y: uy * (1 - k) + k * p.y }, next));
    },
    [clampPan],
  );

  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const baseScale = Math.min(rect.width / W, rect.height / H) || 1;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const { zoom: z } = view.current;
      zoomAtRef.current(
        z * Math.exp(-dy * 0.0018),
        (e.clientX - rect.left - rect.width / 2) / baseScale,
        (e.clientY - rect.top - rect.height / 2) / baseScale,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);


  // ---- storm geometry ------------------------------------------------------
  /** NHC-style cone: circles of uncertainty swept along the track, offset on the segment normal. */
  const conePath = useMemo(() => {
    const pts = event.forecast.map((p) => {
      const [x, y] = project(p.lon, p.lat, v);
      return { x, y, r: milesToPx(Math.max(p.coneRadiusMi, 8), v) };
    });
    if (pts.length < 2) return "";
    const upper: string[] = [];
    const lower: string[] = [];
    for (let i = 0; i < pts.length; i++) {
      const prev = pts[Math.max(0, i - 1)]!;
      const next = pts[Math.min(pts.length - 1, i + 1)]!;
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const p = pts[i]!;
      upper.push(`${(p.x + nx * p.r).toFixed(1)},${(p.y + ny * p.r).toFixed(1)}`);
      lower.unshift(`${(p.x - nx * p.r).toFixed(1)},${(p.y - ny * p.r).toFixed(1)}`);
    }
    const last = pts[pts.length - 1]!;
    const first = pts[0]!;
    return `M${upper.join(" L")} A${last.r},${last.r} 0 0 1 ${lower[0]} L${lower.slice(1).join(" L")} A${first.r},${first.r} 0 0 1 ${upper[0]} Z`;
  }, [event, v]);

  const trackPath = useMemo(
    () =>
      event.forecast
        .map((p, i) => {
          const [x, y] = project(p.lon, p.lat, v);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" "),
    [event, v],
  );

  const historyPath = useMemo(
    () =>
      event.history
        .map(([lon, lat], i) => {
          const [x, y] = project(lon, lat, v);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" "),
    [event, v],
  );

  const [sx, sy] = project(pos.lon, pos.lat, v);

  /** Asymmetric 34/50/64 kt wind radii — the right-front quadrant runs largest. */
  const windRadii = useMemo(() => {
    const scale = pos.windMph / 130;
    return [
      { kt: 34, mi: 205 * scale, opacity: 0.09 },
      { kt: 50, mi: 125 * scale, opacity: 0.12 },
      { kt: 64, mi: 68 * scale, opacity: 0.18 },
    ].filter((r) => r.mi > 4);
  }, [pos.windMph]);

  const labelZoom = zoom;
  const strokeScale = 1 / Math.sqrt(zoom);
  const bar = scaleBar(190, v, 1);

  const graticule = useMemo(() => {
    const lons: number[] = [];
    const lats: number[] = [];
    for (let lon = Math.ceil(v.minLon / 2) * 2; lon <= v.maxLon; lon += 2) lons.push(lon);
    for (let lat = Math.ceil(v.minLat / 2) * 2; lat <= v.maxLat; lat += 2) lats.push(lat);
    return { lons, lats };
  }, [v]);

  const sortedAssets = useMemo(
    () =>
      assets
        .filter((a) => a.type !== "pipeline")
        .slice()
        .sort(
          (a, b) =>
            (RISK_RANK[risks.get(a.id)?.level ?? "normal"] ?? 0) -
            (RISK_RANK[risks.get(b.id)?.level ?? "normal"] ?? 0),
        ),
    [assets, risks],
  );

  return (
    <div ref={containerRef} className={cn("relative touch-none overflow-hidden bg-ocean-deep", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false };
        }}
        onMouseMove={(e) => {
          const { rect, baseScale } = metrics();
          const ux = (e.clientX - rect.left - rect.width / 2) / baseScale;
          const uy = (e.clientY - rect.top - rect.height / 2) / baseScale;
          const mx = W / 2 + (ux - pan.x) / zoom;
          const my = H / 2 + (uy - pan.y) / zoom;
          setCursor({
            lon: v.minLon + (mx / W) * (v.maxLon - v.minLon),
            lat: v.maxLat - (my / H) * (v.maxLat - v.minLat),
          });
          if (!drag.current) return;
          drag.current.moved = true;
          setPan(
            clampPan(
              {
                x: drag.current.px + (e.clientX - drag.current.x) / baseScale,
                y: drag.current.py + (e.clientY - drag.current.y) / baseScale,
              },
              zoom,
            ),
          );
        }}

        onMouseUp={() => (drag.current = null)}
        onMouseLeave={() => {
          drag.current = null;
          setCursor(null);
          setHovered(null);
        }}
      >
        <defs>
          <radialGradient id="rainfall">
            <stop offset="0%" stopColor="var(--color-rain)" stopOpacity="0.55" />
            <stop offset="60%" stopColor="var(--color-rain)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-rain)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="eyewall">
            <stop offset="0%" stopColor="var(--color-storm)" stopOpacity="0.75" />
            <stop offset="100%" stopColor="var(--color-storm)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="shelfFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-shelf)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--color-shelf)" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <g
          transform={`translate(${pan.x} ${pan.y}) translate(${W / 2} ${H / 2}) scale(${zoom}) translate(${-W / 2} ${-H / 2})`}
        >
          <g>

            {/* ---------- basemap ---------- */}
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="var(--color-ocean-deep)" />
            <path d={bathymetryBand(v)} fill="url(#shelfFade)" />
            <path
              d={polylinePath(SHELF_EDGE, v)}
              fill="none"
              stroke="var(--color-shelf-line)"
              strokeWidth={0.9 * strokeScale}
              strokeDasharray="2 6"
              opacity="0.7"
            />

            {/* graticule with labels */}
            <g stroke="var(--color-grid)" strokeWidth={0.5 * strokeScale} opacity="0.5">
              {graticule.lons.map((lon) => {
                const [x] = project(lon, 0, v);
                return <line key={`lo${lon}`} x1={x} y1={0} x2={x} y2={H} />;
              })}
              {graticule.lats.map((lat) => {
                const [, y] = project(0, lat, v);
                return <line key={`la${lat}`} x1={0} y1={y} x2={W} y2={y} />;
              })}
            </g>
            <g fill="var(--color-grid-label)" fontSize={9 * strokeScale} className="num" opacity="0.75">
              {graticule.lons.map((lon) => {
                const [x] = project(lon, 0, v);
                return (
                  <text key={`lot${lon}`} x={x + 3} y={H - 6}>
                    {Math.abs(lon)}°W
                  </text>
                );
              })}
              {graticule.lats.map((lat) => {
                const [, y] = project(0, lat, v);
                return (
                  <text key={`lat${lat}`} x={5} y={y - 4}>
                    {lat}°N
                  </text>
                );
              })}
            </g>

            {layers["satellite"] && (
              <g opacity="0.4">
                {Array.from({ length: 46 }).map((_, i) => (
                  <ellipse
                    key={i}
                    cx={(i * 197) % W}
                    cy={(i * 313) % H}
                    rx={40 + ((i * 37) % 110)}
                    ry={22 + ((i * 19) % 54)}
                    fill="var(--color-foreground)"
                    opacity="0.05"
                  />
                ))}
              </g>
            )}

            {landPaths(v).map((d, i) => (
              <path key={`land${i}`} d={d} fill="var(--color-land)" />
            ))}
            {shorelinePaths(v).map((d, i) => (
              <path
                key={`shore${i}`}
                d={d}
                fill="none"
                stroke="var(--color-shoreline)"
                strokeWidth={1.1 * strokeScale}
              />
            ))}

            {layers["flood"] &&
              shorelinePaths(v).map((d, i) => (
                <path
                  key={`flood${i}`}
                  d={d}
                  fill="none"
                  stroke="var(--color-flood)"
                  strokeWidth={14 * strokeScale}
                  strokeOpacity="0.3"
                  strokeLinecap="round"
                />
              ))}

            {/* place labels, density tied to zoom */}
            <g pointerEvents="none">
              {PLACES.filter((p) => labelZoom >= p.minZoom).map((p) => {
                const [x, y] = project(p.lon, p.lat, v);
                if (p.kind === "city") {
                  return (
                    <g key={p.name}>
                      <circle cx={x} cy={y} r={1.8 * strokeScale} fill="var(--color-place)" />
                      <text
                        x={x + 5 * strokeScale}
                        y={y + 3 * strokeScale}
                        fontSize={10 * strokeScale}
                        fill="var(--color-place)"
                      >
                        {p.name}
                      </text>
                    </g>
                  );
                }
                return (
                  <text
                    key={p.name}
                    x={x}
                    y={y}
                    fontSize={(p.kind === "water" ? 15 : 11) * strokeScale}
                    fill={p.kind === "water" ? "var(--color-water-label)" : "var(--color-region-label)"}
                    textAnchor="middle"
                    letterSpacing={3 * strokeScale}
                    opacity={p.kind === "water" ? 0.55 : 0.75}
                  >
                    {p.name}
                  </text>
                );
              })}
            </g>

            {/* ---------- weather layers ---------- */}
            {layers["rain"] && (
              <g>
                {event.forecast.map((p) => {
                  const [x, y] = project(p.lon, p.lat, v);
                  return <circle key={`r${p.hour}`} cx={x} cy={y} r={milesToPx(180, v)} fill="url(#rainfall)" />;
                })}
              </g>
            )}

            {layers["history"] && (
              <g
                stroke="var(--color-muted-foreground)"
                strokeOpacity="0.35"
                fill="none"
                strokeWidth={1.2 * strokeScale}
                strokeDasharray="3 5"
              >
                <path d={`M${project(-84, 22.6, v)} Q ${project(-89, 26.5, v)} ${project(-93.5, 29.4, v)}`} />
                <path d={`M${project(-84.6, 23.4, v)} Q ${project(-88, 28, v)} ${project(-90.2, 29.1, v)}`} />
                <path d={`M${project(-85.4, 22.4, v)} Q ${project(-91, 27, v)} ${project(-96, 28.6, v)}`} />
              </g>
            )}

            {layers["track"] && (
              <>
                <path
                  d={conePath}
                  fill="var(--color-cone)"
                  fillOpacity="0.12"
                  stroke="var(--color-cone)"
                  strokeOpacity="0.55"
                  strokeWidth={1.2 * strokeScale}
                  strokeDasharray="7 5"
                />
                <path
                  d={historyPath}
                  fill="none"
                  stroke="var(--color-muted-foreground)"
                  strokeWidth={1.8 * strokeScale}
                  strokeDasharray="4 4"
                />
                <path
                  d={trackPath}
                  fill="none"
                  stroke="var(--color-track)"
                  strokeWidth={2.2 * strokeScale}
                  strokeLinecap="round"
                />
                {event.forecast.map((p) => {
                  const [x, y] = project(p.lon, p.lat, v);
                  const r = 6.5 * strokeScale;
                  return (
                    <g key={p.hour}>
                      <circle
                        cx={x}
                        cy={y}
                        r={r}
                        fill={categoryColor(p.category, p.windMph)}
                        stroke="var(--color-background)"
                        strokeWidth={1.1 * strokeScale}
                      />
                      <text
                        x={x}
                        y={y + 2.6 * strokeScale}
                        fontSize={8 * strokeScale}
                        textAnchor="middle"
                        fill="var(--color-background)"
                        fontWeight="700"
                      >
                        {categoryLabel(p.category, p.windMph)}
                      </text>
                      <text
                        x={x + 10 * strokeScale}
                        y={y - 8 * strokeScale}
                        fontSize={9.5 * strokeScale}
                        fill="var(--color-muted-foreground)"
                        className="num"
                      >
                        +{p.hour}h · {p.windMph} mph
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {layers["wind"] && (
              <g pointerEvents="none">
                {windRadii.map((r) => (
                  <g key={r.kt}>
                    <ellipse
                      cx={sx + milesToPx(r.mi * 0.16, v)}
                      cy={sy - milesToPx(r.mi * 0.1, v)}
                      rx={milesToPx(r.mi, v)}
                      ry={milesToPx(r.mi * 0.86, v)}
                      fill="var(--color-storm)"
                      fillOpacity={r.opacity}
                      stroke="var(--color-storm)"
                      strokeOpacity="0.45"
                      strokeWidth={0.8 * strokeScale}
                    />
                    <text
                      x={sx + milesToPx(r.mi * 0.16, v)}
                      y={sy - milesToPx(r.mi * 0.86, v) - 4 * strokeScale}
                      fontSize={9 * strokeScale}
                      textAnchor="middle"
                      className="num"
                      fill="var(--color-storm)"
                      opacity="0.85"
                    >
                      {r.kt} kt
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* ---------- assets ---------- */}
            {layers["assets"] &&
              assets
                .filter((a) => a.type === "pipeline" && a.geometry)
                .map((a) => {
                  const risk = risks.get(a.id);
                  const d = a
                    .geometry!.map(([lon, lat], i) => {
                      const [x, y] = project(lon, lat, v);
                      return `${i === 0 ? "M" : "L"}${x},${y}`;
                    })
                    .join(" ");
                  return (
                    <g key={a.id}>
                      <path
                        d={d}
                        fill="none"
                        stroke="var(--color-background)"
                        strokeOpacity="0.6"
                        strokeWidth={(selectedId === a.id ? 7 : 5) * strokeScale}
                        strokeLinecap="round"
                      />
                      <path
                        d={d}
                        fill="none"
                        stroke={risk ? riskColorVar(risk.level) : "var(--color-muted-foreground)"}
                        strokeWidth={(selectedId === a.id ? 4 : 2.4) * strokeScale}
                        strokeLinecap="round"
                        className="cursor-pointer"
                        onClick={() => onSelect?.(a.id)}
                        onMouseEnter={(e) => setHovered({ asset: a, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHovered(null)}
                      />
                    </g>
                  );
                })}

            {/* storm centre */}
            <g transform={`translate(${sx} ${sy})`} pointerEvents="none">
              <circle r={milesToPx(28, v)} fill="url(#eyewall)" />
              <g>
                <path
                  d={`M0,${-16 * strokeScale} A${16 * strokeScale},${16 * strokeScale} 0 0 1 0,0 A${16 * strokeScale},${16 * strokeScale} 0 0 0 0,${16 * strokeScale} A${16 * strokeScale},${16 * strokeScale} 0 0 1 0,0 A${16 * strokeScale},${16 * strokeScale} 0 0 0 0,${-16 * strokeScale}`}
                  fill="var(--color-storm)"
                  opacity="0.9"
                />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="-360"
                  dur="9s"
                  repeatCount="indefinite"
                />
              </g>
              <circle r={2.5 * strokeScale} fill="var(--color-background)" />
            </g>

            {layers["assets"] &&
              sortedAssets.map((a) => {
                const risk = risks.get(a.id);
                const color = risk ? riskColorVar(risk.level) : "var(--color-risk-normal)";
                const [x, y] = project(a.lon, a.lat, v);
                const isWell = a.type === "well";
                if (isWell && zoom < 1.15 && (risk?.score ?? 0) < 40) {
                  return (
                    <circle key={a.id} cx={x} cy={y} r={1.6 * strokeScale} fill={color} fillOpacity={0.5} />
                  );
                }
                const size = (isWell ? 3 : 6) * strokeScale;
                const selected = selectedId === a.id;
                const hi = highlight.has(a.id);
                const critical = risk?.level === "critical";
                return (
                  <g
                    key={a.id}
                    transform={`translate(${x} ${y})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!drag.current?.moved) onSelect?.(a.id);
                    }}
                    onMouseEnter={(e) => setHovered({ asset: a, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {(selected || hi || (critical && !isWell)) && (
                      <circle r={14 * strokeScale} fill="none" stroke={color} strokeWidth={1.4 * strokeScale}>
                        <animate
                          attributeName="r"
                          values={`${9 * strokeScale};${18 * strokeScale};${9 * strokeScale}`}
                          dur="2.6s"
                          repeatCount="indefinite"
                        />
                        <animate attributeName="opacity" values="0.85;0.1;0.85" dur="2.6s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <path
                      d={markerPath(a.type, size)}
                      fill={color}
                      fillOpacity={isWell ? 0.7 : 0.92}
                      stroke="var(--color-background)"
                      strokeWidth={(isWell ? 0.5 : 1.1) * strokeScale}
                    />
                    {!isWell && (selected || hi || zoom >= 2) && (
                      <text
                        x={9 * strokeScale}
                        y={3.5 * strokeScale}
                        fontSize={9.5 * strokeScale}
                        fill="var(--color-foreground)"
                        stroke="var(--color-background)"
                        strokeWidth={2.4 * strokeScale}
                        paintOrder="stroke"
                      >
                        {a.name}
                      </text>
                    )}
                  </g>
                );
              })}
          </g>
        </g>
      </svg>

      {/* ---------- chrome ---------- */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-20 max-w-56 rounded-md border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
          style={{
            left: Math.max(
              8,
              Math.min(
                (containerRef.current?.clientWidth ?? 400) - 230,
                hovered.x - (containerRef.current?.getBoundingClientRect().left ?? 0) + 14,
              ),
            ),
            top: Math.max(8, hovered.y - (containerRef.current?.getBoundingClientRect().top ?? 0) + 14),
          }}
        >
          <div className="font-medium">{hovered.asset.name}</div>
          <div className="mt-0.5 text-muted-foreground">
            {hovered.asset.operator} · {hovered.asset.region}
          </div>
          {(() => {
            const r = risks.get(hovered.asset.id);
            if (!r) return null;
            return (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: riskColorVar(r.level) }} />
                <span className="num font-semibold">{r.score}</span>
                <span className="text-muted-foreground capitalize">{r.level}</span>
                {r.hoursToImpact !== null && (
                  <span className="num text-muted-foreground">· ETA {r.hoursToImpact}h</span>
                )}
              </div>
            );
          })()}
        </div>
      )}

      <div className="absolute top-3 right-3 flex flex-col gap-1 rounded-md border bg-popover/90 p-1 backdrop-blur">
        <button
          className="rounded-sm p-1.5 hover:bg-accent"
          onClick={() => zoomAt(zoom * 1.5, 0, 0)}
          aria-label="Zoom in"
        >
          <Plus className="size-4" />
        </button>
        <button
          className="rounded-sm p-1.5 hover:bg-accent"
          onClick={() => zoomAt(zoom / 1.5, 0, 0)}
          aria-label="Zoom out"
        >
          <Minus className="size-4" />
        </button>
        <button
          className="rounded-sm p-1.5 hover:bg-accent"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          aria-label="Reset view"
        >
          <Crosshair className="size-4" />
        </button>
      </div>

      {/* scale bar + readout */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-end gap-3">
        <div className="rounded-md border bg-popover/85 px-2.5 py-1.5 backdrop-blur">
          <div
            className="relative border-x border-b border-foreground/70"
            style={{ width: Math.round(bar.px * 0.55), height: 5 }}
          />
          <div className="num mt-1 text-[10px] text-muted-foreground">{bar.miles} mi</div>
        </div>
        <div className="num rounded-md border bg-popover/85 px-2.5 py-1.5 text-[10px] text-muted-foreground backdrop-blur">
          {cursor
            ? `${Math.abs(cursor.lat).toFixed(2)}°N  ${Math.abs(cursor.lon).toFixed(2)}°W`
            : "— °N  — °W"}
          <span className="ml-2 opacity-70">z{zoom.toFixed(1)}</span>
        </div>
      </div>

      <div className="absolute right-3 bottom-3 flex flex-col items-end gap-1.5">
        <div className="rounded-md border bg-popover/90 px-3 py-2 text-[11px] backdrop-blur">
          <div className="label-xs mb-1">Risk state</div>
          <div className="flex gap-3">
            {(["normal", "monitor", "elevated", "high", "critical"] as const).map((l) => (
              <span key={l} className="flex items-center gap-1 capitalize">
                <span className="size-2 rounded-full" style={{ backgroundColor: riskColorVar(l) }} />
                {l}
              </span>
            ))}
          </div>
        </div>
        <div className="pointer-events-none text-[9.5px] text-muted-foreground/70">
          Basemap: Azure Maps · Imagery &amp; hazard layers: Planetary Computer Pro · Track: Aurora/ECMWF cycle
        </div>
      </div>
    </div>
  );
}
