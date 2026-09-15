import { useState } from "react";
import { Cloud, Download, Gauge, RefreshCw, Save, Vibrate } from "lucide-react";
import toast from "react-hot-toast";

import { APP_VERSION } from "../../config/releaseNotes";
import IconTile from "../ui/IconTile";
import StatCard from "../ui/StatCard";
import PanelFrame from "./PanelFrame";
import TinySwitch from "./TinySwitch";
import InfoRow from "./InfoRow";
import VersionInfoButton from "./VersionInfoButton";

import { announce } from "../../utils/announce";
import { getFriendlyErrorMessage } from "../../utils/friendlyError";

export default function SystemPanel({
  theme,
  accentColor,
  cloudEnabled,
  syncState,
  syncTone,
  syncDotClass,
  syncPing,
  dayCount,
  totalCount,
  pendingCount,
  onRetrySync,
  vibrationEnabled,
  setVibrationEnabled,
  canVibrate,
  onExportTech,
  onShowReleaseNotes,
}) {
  const [retrying, setRetrying] = useState(false);

  const canRetrySync =
    Boolean(onRetrySync) &&
    Boolean(cloudEnabled) &&
    (syncTone === "error" || pendingCount > 0);

  async function handleRetrySync() {
    if (retrying) return;

    try {
      setRetrying(true);

      const ok = await onRetrySync();

      if (ok) {
        announce("Sincronizzazione ripristinata");
        toast.success("Sincronizzazione ripristinata");
      } else {
        toast.error(
          getFriendlyErrorMessage(
            null,
            "Non è stato possibile sincronizzare. Riprova tra poco.",
          ),
        );
      }
    } catch (error) {
      toast.error(
        getFriendlyErrorMessage(
          error,
          "Non è stato possibile sincronizzare. Riprova tra poco.",
        ),
      );
    } finally {
      setRetrying(false);
    }
  }
  return (
    <PanelFrame
      eyebrow="Dati e sincronizzazione"
      title="Servizi e salvataggio"
      description="Informazioni sul servizio e sul salvataggio dei dati."
      theme={theme}
    >
      <div
        className="relative min-h-[104px] overflow-hidden rounded-2xl border p-4"
        style={{
          borderColor: `${accentColor}33`,
          backgroundColor: `${accentColor}10`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full blur-3xl"
          style={{ backgroundColor: `${accentColor}24` }}
        />

        <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-amber-400/[0.06] blur-3xl" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <IconTile
              size="xl"
              className="shrink-0 text-white"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 12px 26px ${accentColor}59`,
              }}
            >
              <Cloud className="h-6 w-6" strokeWidth={2.2} />
            </IconTile>

            <div className="min-w-0">
              <p className={`text-base font-black tracking-tight ${theme.primaryText}`}>
                {cloudEnabled ? "Cloud attivo" : "Cloud non disponibile"}
              </p>

              <p
                className={`mt-1 text-xs font-medium leading-relaxed ${theme.muted}`}
              >
                {syncState}
              </p>
            </div>
          </div>

          <span className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em]`}
              style={{
                borderColor: `${accentColor}33`,
                backgroundColor: `${accentColor}12`,
                color: accentColor,
              }}
            >
              <span className={`relative inline-flex h-2 w-2 rounded-full ${syncDotClass}`}>
                {syncPing && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                )}
              </span>

              {cloudEnabled ? "Collegato" : "Non collegato"}
            </span>
          </div>

          {canRetrySync && (
            <button
              type="button"
              onClick={handleRetrySync}
              disabled={retrying}
              className="relative mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: `${accentColor}40`,
                backgroundColor: `${accentColor}12`,
                color: accentColor,
                "--tw-ring-color": `${accentColor}55`,
              }}
            >
              <RefreshCw
                className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`}
                strokeWidth={2.2}
              />

              {retrying
                ? "Sincronizzazione in corso..."
                : "Riprova ora"}
            </button>
          )}
      </div>

      {canVibrate && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setVibrationEnabled(!vibrationEnabled)}
            aria-pressed={vibrationEnabled}
            className={`flex min-h-[104px] w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 ${theme.softSurface}`}
            style={{ "--tw-ring-color": accentColor }}
          >
            <span className="flex min-w-0 items-center gap-3">
              <IconTile
                size="lg"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <Vibrate
                  className="h-5 w-5"
                  strokeWidth={2.2}
                  style={{ color: accentColor }}
                />
              </IconTile>

              <span className="min-w-0">
                <span className={`block text-sm font-black ${theme.primaryText}`}>
                  Vibrazione
                </span>

                <span
                  className={`mt-1 block text-xs font-medium leading-relaxed ${theme.muted}`}
                >
                  Un feedback tattile quando tocchi ciò che conta.
                </span>
              </span>
            </span>

            <TinySwitch value={vibrationEnabled} accentColor={accentColor} />
          </button>
        </div>
      )}

      <div className={`mt-4 rounded-2xl border p-4 ${theme.softSurface}`}>
        <div className="flex items-center gap-3">
          <IconTile
            size="lg"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <Gauge
              className="h-5 w-5"
              strokeWidth={2.2}
              style={{ color: accentColor }}
            />
          </IconTile>

          <div className="min-w-0">
            <p className={`text-sm font-black ${theme.primaryText}`}>
              Controlli avanzati
            </p>

            <p className={`mt-0.5 text-xs font-medium ${theme.muted}`}>
              Diagnostica dell'app e dati tecnici.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatCard
            size="lg"
            label="Giorni registrati"
            value={dayCount}
            theme={theme}
            tone="elevated"
          />

          <StatCard
            size="lg"
            label="Totale segnalazioni"
            value={
              pendingCount > 0
                ? `${totalCount} (+${pendingCount})`
                : totalCount
            }
            theme={theme}
            tone="elevated"
          />
        </div>

        <div className="mt-3 grid gap-2">
          <InfoRow
            label="Versione installata"
            value={APP_VERSION}
            theme={theme}
            action={
              <VersionInfoButton
                onClick={onShowReleaseNotes}
                theme={theme}
                accentColor={accentColor}
              />
            }
          />
        </div>

        <button
          type="button"
          onClick={onExportTech}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold text-white transition hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 12px 28px ${accentColor}40`,
            "--tw-ring-color": `${accentColor}55`,
          }}
        >
          <Download className="h-4 w-4" strokeWidth={2.2} />
          Esporta JSON tecnico
        </button>
      </div>

      <div
        className={`mt-4 flex min-h-[104px] items-center justify-between gap-4 rounded-2xl border p-4 ${theme.softSurface}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <IconTile
            size="lg"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <Save
              className="h-5 w-5"
              strokeWidth={2.2}
              style={{ color: accentColor }}
            />
          </IconTile>

          <div className="min-w-0">
            <p className={`text-sm font-black ${theme.primaryText}`}>
              Salvataggio automatico
            </p>

            <p
              className={`mt-1 text-xs font-medium leading-relaxed ${theme.muted}`}
            >
              I dati vengono salvati automaticamente sul tuo account. Non è
              necessaria alcuna operazione manuale.
            </p>
          </div>
        </div>

        <span
          className="shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em]"
          style={{
            backgroundColor: `${accentColor}18`,
            color: accentColor,
          }}
        >
          Automatico
        </span>
      </div>
    </PanelFrame>
  );
}