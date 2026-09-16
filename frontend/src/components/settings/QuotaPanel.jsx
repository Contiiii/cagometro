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

  const percentage = Math.round(snapshot?.usage?.requests_pct ?? 0);

  const tone =
    percentage >= 90
      ? "danger"
      : percentage >= 70
        ? "warning"
        : "ok";

  const toneColor =
    tone === "danger"
      ? "#f43f5e"
      : tone === "warning"
        ? "#f59e0b"
        : "#10b981";

  const requests = snapshot?.requests ?? 0;
  const monthlyCap = snapshot?.limits?.mau ?? 50000;

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
            <IconTile size="lg" style={{ backgroundColor: `${toneColor}18` }}>
              <Activity
                className="h-5 w-5"
                strokeWidth={2.2}
                style={{ color: toneColor }}
              />
            </IconTile>

            <div className="min-w-0">
              <p className={`text-sm font-black ${theme.primaryText}`}>
                Richieste API
              </p>

              <p className={`mt-0.5 text-xs font-medium ${theme.muted}`}>
                {formatNumber(requests)} su {formatNumber(monthlyCap)} mensili
              </p>
            </div>

            <span
              className="ml-auto shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold"
              style={{
                backgroundColor: `${toneColor}18`,
                color: toneColor,
              }}
            >
              {percentage}%
            </span>
          </div>

          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, percentage)}%`,
                backgroundColor: toneColor,
              }}
            />
          </div>

          <p className={`mt-3 text-[11px] font-medium ${theme.muted}`}>
            Ultimo aggiornamento:{" "}
            {new Date(snapshot.recorded_at).toLocaleDateString("it-IT")}
          </p>
        </div>
      )}
    </PanelFrame>
  );
}