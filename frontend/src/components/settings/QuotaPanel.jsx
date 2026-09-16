import { useEffect, useState } from "react";
import { RefreshCw, Activity } from "lucide-react";

import IconTile from "../ui/IconTile";
import PanelFrame from "./PanelFrame";

import { fetchQuotaSnapshot } from "../../services/quotaService";

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
        console.error("Errore caricamento quota:", error);
        setAvailable(false);
      } finally {
        setLoading(false);
      }
    }

    loadQuota();
  }, [cloudEnabled]);

  const usage = snapshot?.usage ?? {};

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

  const formatNumber = (value) => value.toLocaleString("it-IT");

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
