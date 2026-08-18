import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell, PageHeader } from "@/components/ops/AppShell";
import { alertsQuery, assetsQuery } from "@/lib/hooks/use-ops-data";
import { services } from "@/lib/services";
import { relativeTime, riskColorVar, utcStamp } from "@/lib/format";
import type { AlertSeverity, OpsAlert } from "@/lib/domain/types";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts | Gulf Asset Weather Risk" },
      {
        name: "description",
        content: "Operational alert center with severity, ownership, acknowledgement and status for weather-driven asset risk.",
      },
      { property: "og:title", content: "Alerts | Gulf Asset Weather Risk" },
      { property: "og:description", content: "Weather-driven operational alerts with acknowledgement workflow." },
    ],
  }),
  component: AlertsPage,
});

const SEVERITY_TONE: Record<AlertSeverity, "critical" | "high" | "monitor" | "normal"> = {
  critical: "critical",
  warning: "high",
  advisory: "monitor",
  info: "normal",
};

function AlertsPage() {
  const qc = useQueryClient();
  const alerts = useQuery(alertsQuery).data ?? [];
  const assets = useQuery(assetsQuery).data ?? [];
  const [severity, setSeverity] = useState<AlertSeverity | "all">("all");
  const [status, setStatus] = useState<OpsAlert["status"] | "all">("all");

  const rows = alerts
    .filter((a) => (severity === "all" ? true : a.severity === severity))
    .filter((a) => (status === "all" ? true : a.status === status));

  async function setAlertStatus(id: string, next: OpsAlert["status"]) {
    await services.alerts.setStatus(id, next);
    await qc.invalidateQueries({ queryKey: ["alerts"] });
  }

  const counts = (["critical", "warning", "advisory", "info"] as AlertSeverity[]).map((s) => ({
    s,
    n: alerts.filter((a) => a.severity === s && a.status !== "resolved").length,
  }));

  return (
    <AppShell>
      <PageHeader
        title="Alerts"
        description="Threshold breaches, corridor entries and forecast updates routed to the accountable operations owner."
      />
      <div className="space-y-4 p-4">
        <div className="panel grid grid-cols-2 divide-x sm:grid-cols-4">
          {counts.map((c) => (
            <button
              key={c.s}
              onClick={() => setSeverity(severity === c.s ? "all" : c.s)}
              className={`px-4 py-3 text-left hover:bg-accent/50 ${severity === c.s ? "bg-accent/60" : ""}`}
            >
              <div className="label-xs" style={{ color: riskColorVar(SEVERITY_TONE[c.s]) }}>
                {c.s}
              </div>
              <div className="num mt-1 text-xl font-semibold">{c.n}</div>
            </button>
          ))}
        </div>

        <div className="panel">
          <div className="flex items-center gap-2 border-b px-4 py-2.5">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OpsAlert["status"] | "all")}
              className="rounded-sm border bg-card px-2 py-1.5 text-xs"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
            <span className="ml-auto text-[11px] text-muted-foreground">{rows.length} alerts</span>
          </div>
          <ul className="divide-y">
            {rows.map((a) => {
              const asset = assets.find((x) => x.id === a.assetId);
              return (
                <li key={a.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: riskColorVar(SEVERITY_TONE[a.severity]) }}
                  />
                  <div className="min-w-[240px] flex-1">
                    <div className="text-xs font-medium">{a.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{a.detail}</div>
                    <div className="num mt-1 text-[10px] text-muted-foreground">
                      {a.id} · {asset ? asset.name : "Estate-wide"} · owner {a.owner} · {utcStamp(a.createdAtIso)} (
                      {relativeTime(a.createdAtIso)})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-sm border px-2 py-1 text-[10px] tracking-wider uppercase">{a.status}</span>
                    {a.status === "open" && (
                      <button
                        onClick={() => setAlertStatus(a.id, "acknowledged")}
                        className="rounded-sm border px-2 py-1 text-[11px] hover:bg-accent"
                      >
                        Acknowledge
                      </button>
                    )}
                    {a.status !== "resolved" && (
                      <button
                        onClick={() => setAlertStatus(a.id, "resolved")}
                        className="rounded-sm border px-2 py-1 text-[11px] hover:bg-accent"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
