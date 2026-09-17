import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Activity, Radio, Rocket } from "lucide-react";

import IconTile from "../ui/IconTile";
import PanelFrame from "./PanelFrame";

import { fetchQuotaSnapshot } from "../../services/quotaService";
import {
  FREE_PLAN_LIMITS,
  formatBytes,
  percentUsed,
} from "../../services/quotaLimits";
import { reportError } from "../../utils/reportError";

function PlanMeterRow({ metric, accentColor, theme }) {
  const warning = metric.pct != null && metric.pct >= 80;
  const barColor = warning ? "#f59e0b" : accentColor;

  return (
    <div className="rounded-xl border px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[11px] font-semibold uppercase tracking-wide ${theme.muted}`}>
          {metric.label}
        </span>

        {metric.pct != null && (
          <span
            className="text-[11px] font-black"
            style={{ color: warning ? "#f59e0b" : accentColor }}
          >
            {metric.pct}%
          </span>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
        <span className={`text-sm font-black ${theme.primaryText}`}>
          {metric.valueText}
        </span>

        <span className={`text-[11px] font-medium ${theme.muted}`}>
          di {metric.limitText}
        </span>
      </div>

      {metric.pct != null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full rounded-full"
            style={{ width: `${metric.pct}%`, backgroundColor: barColor }}
          />
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value, sub, accentColor, icon, theme }) {
  return (
    <div className="rounded-xl border px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }}>
          {icon}
        </span>

        <dt className={`text-[11px] font-semibold uppercase tracking-wide ${theme.muted}`}>
          {label}
        </dt>
      </div>

      <dd className={`mt-0.5 text-sm font-black ${theme.primaryText}`}>
        {value}
      </dd>

      {sub && <dd className={`text-[10px] font-medium ${theme.muted}`}>{sub}</dd>}
    </div>
  );
}

export default function QuotaPanel({
  theme,
  accentColor,
  cloudEnabled,
}) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    async function loadQuota() {
      if (!cloudEnabled) {
        setAvailable(false);
        setLoading(false);
        return;
      }

      try {
        const data = await fetchQuotaSnapshot();

        setSnapshot(data);
        setAvailable(Boolean(data));
      } catch (error) {
        reportError(error, {
          feature: "quota-load",
          message: "Errore caricamento quota:",
        });
        setAvailable(false);
      } finally {
        setLoading(false);
      }
    }

    loadQuota();
  }, [cloudEnabled]);

  const usage = snapshot?.usage ?? {};
  const limits = { ...FREE_PLAN_LIMITS, ...(snapshot?.limits ?? {}) };

  const requests =
    snapshot?.requests ??
    (usage.total_auth_requests ?? 0) +
      (usage.total_rest_requests ?? 0) +
      (usage.total_realtime_requests ?? 0) +
      (usage.total_storage_requests ?? 0);

  const breakdown = [
    { label: "Auth", value: usage.total_auth_requests ?? 0 },
    { label: "REST", value: usage.total_rest_requests ?? 0 },
    { label: "Realtime", value: usage.total_realtime_requests ?? 0 },
    { label: "Storage", value: usage.total_storage_requests ?? 0 },
  ];

  const planMetrics = [];

  if (usage.database_size_bytes != null) {
    const current = Number(usage.database_size_bytes) || 0;
    const limit = Number(limits.database_size_bytes) || 0;

    planMetrics.push({
      key: "database",
      label: "Database",
      valueText: formatBytes(current),
      limitText: formatBytes(limit),
      pct: percentUsed(current, limit),
    });
  }

  if (usage.storage_bytes != null) {
    const current = Number(usage.storage_bytes) || 0;
    const limit = Number(limits.storage_bytes) || 0;

    planMetrics.push({
      key: "storage",
      label: "Storage",
      valueText: formatBytes(current),
      limitText: formatBytes(limit),
      pct: percentUsed(current, limit),
    });
  }

  if (usage.mau != null) {
    const current = Number(usage.mau) || 0;
    const limit = Number(limits.mau) || 0;

    planMetrics.push({
      key: "mau",
      label: "Utenti attivi / mese",
      valueText: Number(current).toLocaleString("it-IT"),
      limitText: Number(limit).toLocaleString("it-IT"),
      pct: percentUsed(current, limit),
    });
  }

  const edgeTotal =
    usage.edge_total_invocations != null
      ? Number(usage.edge_total_invocations) || 0
      : null;

  const realtimeRequests =
    usage.total_realtime_requests != null
      ? Number(usage.total_realtime_requests) || 0
      : null;

  const formatNumber = (value) =>
    Number(value ?? 0).toLocaleString("it-IT");

  return (
    <PanelFrame
      eyebrow="Piano e consumo"
      title="Risorse del servizio"
      description="Monitora l’utilizzo del progetto per restare nel piano gratuito."
      theme={theme}
    >
      {loading ? (
        <div className="flex min-h-[104px] items-center gap-3 rounded-2xl border p-4">
          <RefreshCw className="h-5 w-5 animate-spin" strokeWidth={2.2} style={{ color: accentColor }} />
          <p className={`text-sm font-medium ${theme.muted}`}>
            Caricamento consumo…
          </p>
        </div>
      ) : !available ? (
        <div className={`flex min-h-[104px] items-center gap-3 rounded-2xl border p-4 ${theme.softSurface}`}>
          <IconTile size="lg" style={{ backgroundColor: `${accentColor}15` }}>
            <Activity className="h-5 w-5" strokeWidth={2.2} style={{ color: accentColor }} />
          </IconTile>

          <div className="min-w-0">
            <p className={`text-sm font-black ${theme.primaryText}`}>
              Dati non disponibili
            </p>

            <p className={`mt-1 text-xs font-medium leading-relaxed ${theme.muted}`}>
              Il monitoraggio del piano non è ancora attivo sul progetto.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-2xl border p-4 ${theme.softSurface}`}
        >
          <div className="flex items-center gap-3">
            <IconTile size="lg" style={{ backgroundColor: `${accentColor}15` }}>
              <Activity
                className="h-5 w-5"
                strokeWidth={2.2}
                style={{ color: accentColor }}
              />
            </IconTile>

            <div className="min-w-0">
              <p className={`text-sm font-black ${theme.primaryText}`}>
                Richieste API
              </p>

              <p className={`mt-0.5 text-xs font-medium ${theme.muted}`}>
                {formatNumber(requests)} negli ultimi 7 giorni
              </p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2">
            {breakdown.map((row) => (
              <div key={row.label} className="rounded-xl border px-3 py-2">
                <dt className={`text-[11px] font-semibold uppercase tracking-wide ${theme.muted}`}>
                  {row.label}
                </dt>

                <dd className={`mt-0.5 text-sm font-black ${theme.primaryText}`}>
                  {formatNumber(row.value)}
                </dd>
              </div>
            ))}
          </dl>

          {planMetrics.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <p className={`text-[11px] font-semibold uppercase tracking-wide ${theme.muted}`}>
                Consumo del piano
              </p>

              <div className="mt-3 grid gap-2">
                {planMetrics.map((metric) => (
                  <PlanMeterRow
                    key={metric.key}
                    metric={metric}
                    accentColor={accentColor}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          )}

          {(edgeTotal != null || realtimeRequests != null) && (
            <dl className="mt-4 grid grid-cols-2 gap-2">
              {edgeTotal != null && (
                <StatCell
                  label="Edge functions"
                  value={`${formatNumber(edgeTotal)} invocazioni`}
                  sub="ultimi 7 giorni"
                  accentColor={accentColor}
                  icon={<Rocket className="h-3.5 w-3.5" strokeWidth={2.2} />}
                  theme={theme}
                />
              )}

              {realtimeRequests != null && (
                <StatCell
                  label="Realtime"
                  value={formatNumber(realtimeRequests)}
                  sub="richieste / 7 giorni"
                  accentColor={accentColor}
                  icon={<Radio className="h-3.5 w-3.5" strokeWidth={2.2} />}
                  theme={theme}
                />
              )}
            </dl>
          )}

          <div className="mt-4 flex items-center gap-3 rounded-xl border px-3 py-2">
            <IconTile size="md" style={{ backgroundColor: `${accentColor}12` }}>
              <ExternalLink
                className="h-4 w-4"
                strokeWidth={2.2}
                style={{ color: accentColor }}
              />
            </IconTile>

            <div className="min-w-0">
              <p className={`text-[11px] font-semibold uppercase tracking-wide ${theme.muted}`}>
                Egress
              </p>

              <p className={`mt-0.5 text-xs font-medium leading-relaxed ${theme.muted}`}>
                Non misurabile via API: controlla la dashboard Supabase.
              </p>
            </div>
          </div>

          <p className={`mt-3 text-[11px] font-medium ${theme.muted}`}>
            Ultimo aggiornamento:{" "}
            {snapshot.recordedAt
              ? new Date(snapshot.recordedAt).toLocaleString("it-IT")
              : "—"}
          </p>
        </div>
      )}
    </PanelFrame>
  );
}