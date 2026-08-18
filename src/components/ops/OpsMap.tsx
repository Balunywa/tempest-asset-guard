import { useMemo, useRef, useState } from "react";
import { Minus, Plus, Crosshair } from "lucide-react";

import type { Asset, AssetRisk, WeatherEvent } from "@/lib/domain/types";
import { GULF_VIEW, coastLine, coastPath, milesToPx, project, type Viewport } from "@/lib/map/geo";
import { riskColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";

const W = 1400;
const H = 760;

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
  return { lat: last.lat, lon: last.lon, windMph: last.windMph, coneRadiusMi: last.coneRadiusMi, category: last.category };
}

function markerPath(type: Asset["type"], size: number): string {
  const s = size;
  switch (type) {
    case "offshore_platform":
      return `M${-s},${-s} L${s},${-s} L${s},${s} L${-s},${s} Z`;
    case "refinery":
      return `M${-s},${s} L0,${-s} L${s},${s} Z`;
    case "lng_terminal":
      return `M0,${-s} L${s},0 L0,${s} L${-s},0 Z`;
    case "port":
      return `M${-s},${-s * 0.6} L${s},${-s * 0.6} L${s * 0.6},${s} L${-s * 0.6},${s} Z`;
    case "storage":
      return `M${-s * 0.9},${-s * 0.9} L${s * 0.9},${-s * 0.9} L${s * 0.9},${s * 0.9} L${-s * 0.9},${s * 0.9} Z`;
    default:
      return `M0,${-s * 0.8} L${s * 0.8},0 L0,${s * 0.8} L${-s * 0.8},0 Z`;
  }
}

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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [hovered, setHovered] = useState<Asset | null>(null);

  const pos = interpolatePosition(event, hour);
  const highlight = new Set(highlightIds);

  const conePoints = useMemo(() => {
    const upper: string[] = [];
    const lower: string[] = [];
    for (const p of event.forecast) {
      const [x, y] = project(p.lon, p.lat, v);
      const r = milesToPx(Math.max(p.coneRadiusMi, 6), v);
      upper.push(`${x},${y - r}`);
      lower.unshift(`${x},${y + r}`);
    }
    return [...upper, ...lower].join(" ");
  }, [event, v]);

  const trackPath = useMemo(
    () =>
      event.forecast
        .map((p, i) => {
          const [x, y] = project(p.lon, p.lat, v);
          return `${i === 0 ? "M" : "L"}${x},${y}`;
        })
        .join(" "),
    [event, v],
  );

  const historyPath = useMemo(
    () =>
      event.history
        .map(([lon, lat], i) => {
          const [x, y] = project(lon, lat, v);
          return `${i === 0 ? "M" : "L"}${x},${y}`;
        })
        .join(" "),
    [event, v],
  );

  const [sx, sy] = project(pos.lon, pos.lat, v);

  return (
    <div className={cn("relative overflow-hidden bg-ocean", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        preserveAspectRatio="xMidYMid slice"
        onMouseDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
        }}
        onMouseMove={(e) => {
          if (!drag.current) return;
          setPan({
            x: drag.current.px + (e.clientX - drag.current.x),
            y: drag.current.py + (e.clientY - drag.current.y),
          });
        }}
        onMouseUp={() => (drag.current = null)}
        onMouseLeave={() => (drag.current = null)}
      >
        <defs>
          <pattern id="graticule" width="70" height="70" patternUnits="userSpaceOnUse">
            <path d="M70 0 L0 0 0 70" fill="none" stroke="var(--color-grid)" strokeWidth="0.6" opacity="0.55" />
          </pattern>
          <radialGradient id="rainfall">
            <stop offset="0%" stopColor="var(--color-rain)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-rain)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="windfield">
            <stop offset="0%" stopColor="var(--color-storm)" stopOpacity="0.55" />
            <stop offset="55%" stopColor="var(--color-storm)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-storm)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          <rect width={W} height={H} fill="var(--color-ocean)" />
          <rect width={W} height={H} fill="url(#graticule)" />

          {layers["satellite"] && (
            <g opacity="0.35">
              {Array.from({ length: 34 }).map((_, i) => (
                <ellipse
                  key={i}
                  cx={(i * 197) % W}
                  cy={(i * 313) % H}
                  rx={40 + ((i * 37) % 90)}
                  ry={22 + ((i * 19) % 46)}
                  fill="var(--color-foreground)"
                  opacity="0.06"
                />
              ))}
            </g>
          )}

          <path d={coastPath(v)} fill="var(--color-land)" />
          <path d={coastLine(v)} fill="none" stroke="var(--color-border)" strokeWidth="1.4" />

          {layers["flood"] && (
            <path
              d={coastLine(v)}
              fill="none"
              stroke="var(--color-flood)"
              strokeWidth="16"
              strokeOpacity="0.28"
              strokeLinecap="round"
            />
          )}

          {layers["rain"] && (
            <g>
              {event.forecast.map((p) => {
                const [x, y] = project(p.lon, p.lat, v);
                return (
                  <circle key={`r${p.hour}`} cx={x} cy={y} r={milesToPx(190, v)} fill="url(#rainfall)" />
                );
              })}
            </g>
          )}

          {layers["history"] && (
            <g stroke="var(--color-muted-foreground)" strokeOpacity="0.4" fill="none" strokeDasharray="3 5">
              <path d={`M${project(-84, 24.6, v)} Q ${project(-89, 26.5, v)} ${project(-93.5, 29.4, v)}`} />
              <path d={`M${project(-84.6, 25.4, v)} Q ${project(-88, 28, v)} ${project(-90.2, 29.1, v)}`} />
              <path d={`M${project(-85.4, 24.4, v)} Q ${project(-91, 27, v)} ${project(-96, 28.6, v)}`} />
            </g>
          )}

          {layers["track"] && (
            <>
              <polygon points={conePoints} fill="var(--color-cone)" fillOpacity="0.14" stroke="var(--color-cone)" strokeOpacity="0.5" strokeDasharray="6 4" />
              <path d={historyPath} fill="none" stroke="var(--color-muted-foreground)" strokeWidth="2" strokeDasharray="4 4" />
              <path d={trackPath} fill="none" stroke="var(--color-storm)" strokeWidth="2.4" />
              {event.forecast.map((p) => {
                const [x, y] = project(p.lon, p.lat, v);
                return (
                  <g key={p.hour}>
                    <circle cx={x} cy={y} r={4} fill="var(--color-storm)" />
                    <text x={x + 8} y={y - 7} fontSize="11" fill="var(--color-muted-foreground)" className="num">
                      +{p.hour}h
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {layers["wind"] && (
            <>
              <circle cx={sx} cy={sy} r={milesToPx(230, v)} fill="url(#windfield)" />
              <circle cx={sx} cy={sy} r={milesToPx(120, v)} fill="none" stroke="var(--color-storm)" strokeOpacity="0.5" strokeDasharray="4 6" />
            </>
          )}

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
                  <path
                    key={a.id}
                    d={d}
                    fill="none"
                    stroke={risk ? riskColorVar(risk.level) : "var(--color-muted-foreground)"}
                    strokeWidth={selectedId === a.id ? 5 : 3}
                    strokeOpacity={0.9}
                    className="cursor-pointer"
                    onClick={() => onSelect?.(a.id)}
                    onMouseEnter={() => setHovered(a)}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })}

          {/* Storm center */}
          <g transform={`translate(${sx} ${sy})`} pointerEvents="none">
            <circle r="13" fill="none" stroke="var(--color-storm)" strokeWidth="2.5" />
            <path d="M0,-13 A13,13 0 0,1 0,0 A13,13 0 0,0 0,13" fill="var(--color-storm)" opacity="0.85" />
            <circle r="3" fill="var(--color-storm)" />
          </g>

          {layers["assets"] &&
            assets
              .filter((a) => a.type !== "pipeline")
              .map((a) => {
                const risk = risks.get(a.id);
                const color = risk ? riskColorVar(risk.level) : "var(--color-risk-normal)";
                const [x, y] = project(a.lon, a.lat, v);
                const isWell = a.type === "well";
                const size = isWell ? 3.2 : 6.2;
                const selected = selectedId === a.id;
                const hi = highlight.has(a.id);
                return (
                  <g
                    key={a.id}
                    transform={`translate(${x} ${y})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect?.(a.id);
                    }}
                    onMouseEnter={() => setHovered(a)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {(selected || hi) && (
                      <circle r={16} fill="none" stroke={color} strokeWidth="1.6" opacity="0.9">
                        <animate attributeName="r" values="12;20;12" dur="2.4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.9;0.15;0.9" dur="2.4s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <path
                      d={markerPath(a.type, size)}
                      fill={color}
                      fillOpacity={isWell ? 0.65 : 0.9}
                      stroke="var(--color-background)"
                      strokeWidth={isWell ? 0.6 : 1.2}
                    />
                    {!isWell && (selected || hi) && (
                      <text x={10} y={4} fontSize="11" fill="var(--color-foreground)" className="num">
                        {a.name}
                      </text>
                    )}
                  </g>
                );
              })}
        </g>
      </svg>

      {hovered && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
          <div className="font-medium">{hovered.name}</div>
          <div className="text-muted-foreground">
            {hovered.operator} · {hovered.region}
          </div>
        </div>
      )}

      <div className="absolute top-3 right-3 flex flex-col gap-1 rounded-md border bg-popover/90 p-1 backdrop-blur">
        <button
          className="rounded-sm p-1.5 hover:bg-accent"
          onClick={() => setZoom((z) => Math.min(6, z * 1.35))}
          aria-label="Zoom in"
        >
          <Plus className="size-4" />
        </button>
        <button
          className="rounded-sm p-1.5 hover:bg-accent"
          onClick={() => setZoom((z) => Math.max(1, z / 1.35))}
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

      <div className="absolute bottom-3 right-3 rounded-md border bg-popover/90 px-3 py-2 text-[11px] backdrop-blur">
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
    </div>
  );
}
