import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { AppShell } from "@/components/ops/AppShell";
import { OpsMap } from "@/components/ops/OpsMap";
import { AssetDetailPanel } from "@/components/ops/AssetDetailPanel";
import { RiskBadge, StatCell } from "@/components/ops/RiskBadge";
import { alertsQuery, useOpsSnapshot } from "@/lib/hooks/use-ops-data";
import { ASSET_TYPE_LABEL, relativeTime, riskColorVar } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Operations Overview | Gulf Asset Weather Risk" },
      {
        name: "description",
        content:
          "Executive operations view of Gulf of Mexico hurricane exposure across offshore platforms, pipelines, refineries and LNG terminals.",
      },
      { property: "og:title", content: "Operations Overview | Gulf Asset Weather Risk" },
      {
        property: "og:description",
        content: "Live hurricane and asset exposure intelligence for oil & gas operations teams.",
      },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const { assets, risks, riskMap, event, metrics } = useOpsSnapshot(72);
  const alerts = useQuery(alertsQuery);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedAsset = assets.find((a) => a.id === selected) ?? null;

  const ranked = [...risks].sort((a, b) => b.score - a.score).slice(0, 8);
  const nameOf = (id: string) => assets.find((a) => a.id === id)?.name ?? id;

  const timeline = [24, 48, 72].map((h) => ({
    hour: h,
    exposed: risks.filter((r) => (r.hoursToImpact ?? 999) <= h && r.score >= 42).length,
    critical: risks.filter((r) => (r.hoursToImpact ?? 999) <= h && r.level === "critical").length,
  }));

  return (
    <AppShell>
      <div className="border-b bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {event?.name ?? "No active event"} — 72 hour outlook
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {event?.status} · moving {Math.round(event?.movementMph ?? 0)} mph · 72-hour forecast updated{" "}
              {event ? relativeTime(event.updatedAtIso) : "—"}
            </p>
          </div>
          <Link
            to="/copilot"
            className="inline-flex items-center gap-2 rounded-sm border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
          >
            <Sparkles className="size-3.5" /> Ask the operations assistant
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 border-t md:grid-cols-3 xl:grid-cols-6">
          <StatCell label="Assets monitored" value={metrics.monitored} sub="Across 4 business units" />
          <StatCell label="Assets exposed" value={metrics.exposed} sub="Elevated risk or higher" />
          <StatCell label="Inside forecast cone" value={metrics.insideCone} sub="Projected impact corridor" />
          <StatCell label="High risk" value={metrics.high} tone="high" sub="Score 62–79" />
          <StatCell label="Critical" value={metrics.critical} tone="critical" sub="Score 80+" />
          <StatCell
            label="First expected impact"
            value={metrics.firstImpactHours === null ? "—" : `${metrics.firstImpactHours} h`}
            sub="Earliest asset onset"
          />
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <div className="label-xs">Operational picture — Gulf of Mexico</div>
              <Link to="/map" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                Open full map <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="relative h-[440px]">
              {event && (
                <OpsMap
                  className="h-full w-full"
                  assets={assets}
                  risks={riskMap}
                  event={event}
                  layers={{ assets: true, track: true, wind: true }}
                  selectedId={selected}
                  onSelect={setSelected}
                />
              )}
            </div>
          </div>

          <div className="panel">
            <div className="border-b px-4 py-2.5 label-xs">Highest exposure — ranked</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Asset</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Risk</th>
                  <th className="px-4 py-2 font-medium">Impact ETA</th>
                  <th className="px-4 py-2 font-medium">Primary threat</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r) => {
                  const asset = assets.find((a) => a.id === r.assetId)!;
                  return (
                    <tr
                      key={r.assetId}
                      className="cursor-pointer border-t hover:bg-accent/50"
                      onClick={() => setSelected(r.assetId)}
                    >
                      <td className="px-4 py-2 font-medium">{nameOf(r.assetId)}</td>
                      <td className="px-4 py-2 text-muted-foreground">{ASSET_TYPE_LABEL[asset.type]}</td>
                      <td className="px-4 py-2">
                        <RiskBadge level={r.level} score={r.score} />
                      </td>
                      <td className="num px-4 py-2">{r.hoursToImpact ?? "—"} h</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {r.forecastWindMph >= 74 ? `${r.forecastWindMph} mph sustained wind` : `${r.rainfallIn} in rainfall`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-4">
            <div className="label-xs mb-2 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" /> Operational summary
            </div>
            <p className="text-xs leading-relaxed">
              {event?.name} is forecast to enter the central Gulf within 48 hours as a Category 4 system.{" "}
              <strong>{metrics.insideCone} facilities</strong> are currently inside the projected impact corridor and{" "}
              <strong>{metrics.exposed} assets</strong> carry elevated risk or higher. Platform Delta-7 has the highest
              exposure based on forecast wind intensity and storm proximity, with first onset in{" "}
              {metrics.firstImpactHours ?? "—"} hours.
            </p>
            <div className="mt-3 text-[11px] text-muted-foreground">
              Generated from the current forecast cycle, asset register and risk model.
            </div>
          </div>

          <div className="panel">
            <div className="border-b px-4 py-2.5 label-xs">Upcoming impact timeline</div>
            <div className="space-y-3 p-4">
              {timeline.map((t) => (
                <div key={t.hour}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="num">+{t.hour} h</span>
                    <span className="text-muted-foreground">
                      {t.exposed} exposed · {t.critical} critical
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (t.exposed / Math.max(1, metrics.exposed)) * 100)}%`,
                        backgroundColor: riskColorVar(t.critical > 0 ? "critical" : "elevated"),
                      }}
                    />
                  </div>
                </div>
              ))}
              <Link to="/timeline" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                Scrub the forecast timeline <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>

          <div className="panel">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <span className="label-xs">Active alerts</span>
              <Link to="/alerts" className="text-[11px] text-primary hover:underline">
                All alerts
              </Link>
            </div>
            <ul className="divide-y">
              {(alerts.data ?? []).filter((a) => a.status !== "resolved").slice(0, 5).map((a) => (
                <li key={a.id} className="px-4 py-2.5">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: riskColorVar(
                          a.severity === "critical" ? "critical" : a.severity === "warning" ? "high" : "monitor",
                        ),
                      }}
                    />
                    <div>
                      <div className="text-xs leading-snug font-medium">{a.title}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {a.owner} · {relativeTime(a.createdAtIso)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {selectedAsset && (
        <div className="fixed inset-y-0 right-0 z-30 w-full max-w-sm border-l shadow-2xl">
          <AssetDetailPanel
            asset={selectedAsset}
            risk={riskMap.get(selectedAsset.id)}
            event={event}
            allAssets={assets}
            onClose={() => setSelected(null)}
            onSelect={setSelected}
          />
        </div>
      )}
    </AppShell>
  );
}
