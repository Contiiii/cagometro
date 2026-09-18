import {
  BellRing,
  BellOff,
  BellPlus,
  TrendingUp,
  Trophy,
  UserPlus,
  ListChecks,
  Trash2,
} from "lucide-react";

import { useState } from "react";

import { toast } from "react-hot-toast";

import IconTile from "../ui/IconTile";
import PanelFrame from "./PanelFrame";
import TinySwitch from "./TinySwitch";

import { usePush } from "../../hooks/usePush";
import { formatRelativeTime } from "../../utils/date";

function SettingToggleCard({
  icon: Icon,
  title,
  description,
  value,
  onChange,
  theme,
  accentColor,
  disabled,
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ "--tw-ring-color": accentColor }}
    >
      <span className="flex min-w-0 items-center gap-3">
        <IconTile
          size="md"
          rounded="rounded-xl"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon
            className="h-5 w-5"
            strokeWidth={2.2}
            style={{ color: accentColor }}
          />
        </IconTile>

        <span className="min-w-0">
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

      <TinySwitch value={value} accentColor={accentColor} />
    </button>
  );
}

export default function NotificationsPanel({
  theme,
  accentColor,
  dailyReminder,
  streakAlerts,
  achievementAlerts,
  teamEntryAlerts,
  teamMemberAlerts,
  teamAchievementAlerts,
  updateSetting,
}) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isBusy,
    subscribe,
    unsubscribe,
    devices,
    devicesLoading,
    currentEndpoint,
    removeDevice,
    subscribeError,
    subscribeConflict,
    claim,
    dismissConflict,
  } = usePush();

  const [removingEndpoint, setRemovingEndpoint] = useState(null);

  const pushActive = permission === "granted" && isSubscribed;

  function handleToggleDevicePush() {
    if (pushActive) {
      unsubscribe();
    } else {
      subscribe();
    }
  }

  async function handleRemoveDevice(endpoint) {
    setRemovingEndpoint(endpoint);

    try {
      await removeDevice(endpoint);
    } finally {
      setRemovingEndpoint(null);
    }
  }

  async function handleClaimDevice() {
    const result = await claim();

    if (!result?.error) {
      toast.success("Notifiche collegate a questo account");
    }
  }

  return (
    <PanelFrame
      eyebrow="Notifiche"
      title="Solo quando serve"
      description="Avvisi utili, senza trasformare il telefono in una sirena."
      theme={theme}
    >
      <div className={`rounded-2xl border p-4 ${theme.softSurface}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <IconTile
              size="md"
              rounded="rounded-xl"
              style={{
                backgroundColor: `${accentColor}15`,
              }}
            >
              {pushActive ? (
                <BellRing
                  className="h-5 w-5"
                  strokeWidth={2.2}
                  style={{ color: accentColor }}
                />
              ) : (
                <BellOff
                  className="h-5 w-5"
                  strokeWidth={2.2}
                  style={{ color: accentColor }}
                />
              )}
            </IconTile>

            <div className="min-w-0">
              <p className={`text-sm font-black ${theme.primaryText}`}>
                Notifiche del dispositivo
              </p>

              <p className={`mt-1 text-xs font-medium ${theme.muted}`}>
                {!isSupported
                  ? "Questo browser non supporta le notifiche."
                  : pushActive
                    ? "Le notifiche sono attive su questo dispositivo."
                    : permission === "denied"
                      ? "Permesso negato. Aggiornalo dalle impostazioni del browser."
                      : "Attiva le notifiche per ricevere gli avvisi scelti qui sotto."}
              </p>
            </div>
          </div>

          {isSupported && (
            <button
              type="button"
              onClick={() => handleToggleDevicePush()}
              disabled={isBusy || (permission === "denied" && !pushActive)}
              className="shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] transition enabled:hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: pushActive
                  ? `${accentColor}18`
                  : "rgba(120,120,120,0.15)",
                color: pushActive ? accentColor : theme.subtle,
              }}
            >
              {pushActive ? "Disattiva" : "Attiva"}
            </button>
          )}
        </div>
      </div>

      {subscribeError && (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-xs font-medium ${theme.muted}`}
          style={{ borderColor: "currentColor", backgroundColor: `${accentColor}0d` }}
        >
          Attivazione fallita: {subscribeError}
          {typeof window !== "undefined" &&
            !window.navigator.standalone && (
              <span className="block mt-1">
                Apri l'app dall'icona Home (aggiungi a schermata Home).
              </span>
            )}
        </div>
      )}

      {subscribeConflict && (
        <div className={`mt-4 rounded-2xl border p-4 ${theme.softSurface}`}>
          <p className={`text-sm font-black ${theme.primaryText}`}>
            Notifiche già collegate a un altro account
          </p>

          <p
            className={`mt-1 text-xs font-medium leading-relaxed ${theme.muted}`}
          >
            Le notifiche di questo dispositivo sono collegate a un altro
            account. Vuoi collegarle all'account corrente?
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleClaimDevice}
              disabled={isBusy}
              className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] transition enabled:hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: `${accentColor}18`,
                color: accentColor,
              }}
            >
              {isBusy ? "Collegamento…" : "Collega a questo account"}
            </button>

            <button
              type="button"
              onClick={dismissConflict}
              disabled={isBusy}
              className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] transition enabled:hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2"
              style={{ color: theme.subtle }}
            >
              Non ora
            </button>
          </div>
        </div>
      )}

      {pushActive && (
        <div
          className={`mt-4 overflow-hidden rounded-2xl border ${theme.softSurface}`}
        >
          <p
            className={`px-4 pb-3 pt-4 text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
          >
            I tuoi dispositivi ({devices.length})
          </p>

          {devicesLoading && devices.length === 0 ? (
            <p className={`px-4 pb-4 text-xs font-medium ${theme.muted}`}>
              Caricamento…
            </p>
          ) : devices.length === 0 ? (
            <p className={`px-4 pb-4 text-xs font-medium ${theme.muted}`}>
              Nessun dispositivo registrato.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {devices.map((device) => (
                <li
                  key={device.endpoint}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm font-bold ${theme.primaryText}`}
                    >
                      {device.device_name || "Dispositivo"}
                      {device.endpoint === currentEndpoint && (
                        <span className={`ml-1 text-xs font-medium ${theme.muted}`}>
                          (questo dispositivo)
                        </span>
                      )}
                    </p>

                    <p className={`mt-0.5 text-xs font-medium ${theme.muted}`}>
                      {device.last_seen_at
                        ? `Visto ${formatRelativeTime(device.last_seen_at)}`
                        : "Mai utilizzato"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveDevice(device.endpoint)}
                    disabled={removingEndpoint === device.endpoint}
                    aria-label={`Rimuovi ${device.device_name || "dispositivo"}`}
                    className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] transition enabled:hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2"
                    style={{ color: theme.subtle }}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Rimuovi
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className={`mt-4 overflow-hidden rounded-2xl border ${theme.softSurface}`}>
        <p
          className={`px-4 pb-3 pt-4 text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
        >
          Che cosa ricevere
        </p>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          <SettingToggleCard
            icon={BellPlus}
            title="Promemoria giornaliero"
            description="Un promemoria ogni giorno per non dimenticare."
            value={dailyReminder}
            onChange={(value) => updateSetting("dailyReminder", value)}
            theme={theme}
            accentColor={accentColor}
            disabled={!pushActive}
          />

          <SettingToggleCard
            icon={TrendingUp}
            title="Avvisi streak"
            description="Quando la tua serie è a rischio o va a buon fine."
            value={streakAlerts}
            onChange={(value) => updateSetting("streakAlerts", value)}
            theme={theme}
            accentColor={accentColor}
            disabled={!pushActive}
          />

          <SettingToggleCard
            icon={Trophy}
            title="Traguardi"
            description="Quando sblocchi un nuovo traguardo."
            value={achievementAlerts}
            onChange={(value) => updateSetting("achievementAlerts", value)}
            theme={theme}
            accentColor={accentColor}
            disabled={!pushActive}
          />

          <SettingToggleCard
            icon={ListChecks}
            title="Registrazioni in squadra"
            description="Quando un membro registra un nuovo traguardo."
            value={teamEntryAlerts}
            onChange={(value) => updateSetting("teamEntryAlerts", value)}
            theme={theme}
            accentColor={accentColor}
            disabled={!pushActive}
          />

          <SettingToggleCard
            icon={UserPlus}
            title="Membri in squadra"
            description="Quando qualcuno entra o lascia la squadra."
            value={teamMemberAlerts}
            onChange={(value) => updateSetting("teamMemberAlerts", value)}
            theme={theme}
            accentColor={accentColor}
            disabled={!pushActive}
          />

          <SettingToggleCard
            icon={Trophy}
            title="Traguardi in squadra"
            description="Quando un membro sblocca un traguardo."
            value={teamAchievementAlerts}
            onChange={(value) => updateSetting("teamAchievementAlerts", value)}
            theme={theme}
            accentColor={accentColor}
            disabled={!pushActive}
          />
        </div>
      </div>
    </PanelFrame>
  );
}