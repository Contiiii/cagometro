import {
  ChevronRight,
  Info,
  Lightbulb,
  LogOut,
  Shield,
  Trash2,
  X,
} from "lucide-react";

import { APP_VERSION } from "../../config/releaseNotes";
import { accentOptions } from "../../config/appearance";
import IconTile from "../ui/IconTile";
import PanelFrame from "./PanelFrame";
import InfoRow from "./InfoRow";
import VersionInfoButton from "./VersionInfoButton";

function ActionRow({
  icon: Icon,
  title,
  description,
  actionLabel,
  theme,
  accentColor,
  onClick,
  disabled = false,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 ${
        disabled ? "cursor-not-allowed opacity-60" : "hover:opacity-90"
      }`}
      style={{ "--tw-ring-color": accentColor }}
    >
      <span className="flex min-w-0 items-start gap-3">
        <IconTile
          size="md"
          rounded="rounded-xl"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon
            className="h-[18px] w-[18px]"
            strokeWidth={2.2}
            style={{ color: accentColor }}
          />
        </IconTile>

        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-black ${theme.primaryText}`}>
            {title}
          </span>
          <span
            className={`mt-1 block text-xs font-medium leading-relaxed ${theme.muted}`}
          >
            {description}
          </span>
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {actionLabel && (
          <span
            className="rounded-full px-3 py-1 text-[11px] font-extrabold"
            style={{
              backgroundColor: `${accentColor}18`,
              color: accentColor,
            }}
          >
            {actionLabel}
          </span>
        )}

        {!disabled && (
          <ChevronRight
            className="h-4 w-4 shrink-0"
            strokeWidth={2.4}
            style={{ color: accentColor }}
          />
        )}
      </span>
    </button>
  );
}

function DangerButton({ icon: Icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`flex min-h-11 w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-bold text-current transition ${
        disabled ? "cursor-not-allowed opacity-50" : "hover:bg-rose-500/10"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.2} />

        <span>{label}</span>
      </span>

      {disabled ? (
        <span className="shrink-0 rounded-full bg-rose-500/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.05em]">
          Prossimamente
        </span>
      ) : (
        <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2.2} />
      )}
    </button>
  );
}

export default function AccountPanel({
  theme,
  accentColor,
  themeMode,
  accent,
  isLoggedIn,
  onDanger,
  onFeedback,
  onPrivacy,
  onDevices,
  onShowReleaseNotes,
}) {
  const accentLabel =
    accentOptions.find((item) => item.id === accent)?.label ?? "Rosa";

  return (
    <PanelFrame
      eyebrow="Account"
      title="Le cose importanti"
      description="Segnalazioni, informazioni chiave e le azioni più delicate."
      theme={theme}
    >
      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          borderColor: `${accentColor}33`,
          backgroundColor: `${accentColor}0d`,
        }}
      >
        <ActionRow
          icon={Lightbulb}
          title="Segnala un'idea"
          description="Migliorie, aggiornamenti o qualsiasi cosa vuoi farmi sapere."
          actionLabel="Scrivi"
          onClick={onFeedback}
          theme={theme}
          accentColor={accentColor}
        />
      </div>

      <div className={`mt-4 overflow-hidden rounded-2xl border ${theme.softSurface}`}>
        <ActionRow
          icon={Shield}
          title="Verifica dispositivi"
          description="Controllo delle sessioni e dei dispositivi collegati."
          onClick={onDevices}
          theme={theme}
          accentColor={accentColor}
        />
      </div>

      <div className={`mt-4 overflow-hidden rounded-2xl border ${theme.softSurface}`}>
        <p
          className={`px-4 pb-3 pt-4 text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
        >
          Informazioni app
        </p>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
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
          <InfoRow
            label="Tema attivo"
            value={
              themeMode === "system"
                ? "Automatico"
                : themeMode === "dark"
                  ? "Scuro"
                  : "Chiaro"
            }
            theme={theme}
          />
          <InfoRow label="Stile" value={accentLabel} theme={theme} />
        </div>
      </div>

      <div className={`mt-4 overflow-hidden rounded-2xl border ${theme.softSurface}`}>
        <ActionRow
          icon={Info}
          title="Informativa privacy"
          description="Come vengono trattati i dati dell'account."
          onClick={onPrivacy}
          theme={theme}
          accentColor={accentColor}
        />
      </div>

      <div className={`mt-4 overflow-hidden rounded-2xl border ${theme.dangerSoft}`}>
        <p className="px-4 pb-1 pt-4 text-xs font-bold uppercase tracking-[0.12em] text-current">
          Azioni delicate
        </p>
        <p className="px-4 pb-3 text-xs font-medium leading-relaxed opacity-80">
          Sono qui apposta: visibili, ma separate dal resto delle impostazioni.
        </p>

        <div className="divide-y divide-rose-500/20">
          {isLoggedIn && (
            <DangerButton
              icon={LogOut}
              label="Disconnetti"
              onClick={() => onDanger("logout")}
            />
          )}

          <DangerButton
            icon={Trash2}
            label="Elimina dati locali"
            onClick={() => onDanger("delete-data")}
          />

          {isLoggedIn && (
            <DangerButton
              icon={X}
              label="Elimina account"
              onClick={() => onDanger("delete-account")}
            />
          )}
        </div>
      </div>
    </PanelFrame>
  );
}