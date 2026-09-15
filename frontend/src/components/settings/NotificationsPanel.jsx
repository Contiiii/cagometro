import { BellRing, TrendingUp, Trophy, UsersRound } from "lucide-react";

import IconTile from "../ui/IconTile";
import PanelFrame from "./PanelFrame";
import TinySwitch from "./TinySwitch";

function SettingToggleCard({
  icon: Icon,
  title,
  description,
  value,
  onChange,
  theme,
  accentColor,
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2"
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
  teamAlerts,
  updateSetting,
}) {
  return (
    <PanelFrame
      eyebrow="Notifiche"
      title="Solo quando serve"
      description="Avvisi utili, senza trasformare il telefono in una sirena."
      theme={theme}
    >
      <div className={`rounded-2xl border p-4 ${theme.softSurface}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-sm font-black ${theme.primaryText}`}>
              Notifiche del dispositivo
            </p>

            <p className={`mt-1 text-xs font-medium ${theme.muted}`}>
              La consegna dei messaggi arriverà presto.
            </p>
          </div>

          <span
            className="shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em]"
            style={{
              backgroundColor: `${accentColor}18`,
              color: accentColor,
            }}
          >
            Prossimamente
          </span>
        </div>
      </div>

      <div className={`mt-4 overflow-hidden rounded-2xl border ${theme.softSurface}`}>
        <p
          className={`px-4 pb-3 pt-4 text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
        >
          Che cosa ricevere
        </p>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          <SettingToggleCard
            icon={BellRing}
            title="Promemoria giornaliero"
            description="Un promemoria ogni giorno per non dimenticare."
            value={dailyReminder}
            onChange={(value) => updateSetting("dailyReminder", value)}
            theme={theme}
            accentColor={accentColor}
          />

          <SettingToggleCard
            icon={TrendingUp}
            title="Avvisi streak"
            description="Quando la tua serie è a rischio o va a buon fine."
            value={streakAlerts}
            onChange={(value) => updateSetting("streakAlerts", value)}
            theme={theme}
            accentColor={accentColor}
          />

          <SettingToggleCard
            icon={Trophy}
            title="Traguardi"
            description="Quando sblocchi un nuovo traguardo."
            value={achievementAlerts}
            onChange={(value) => updateSetting("achievementAlerts", value)}
            theme={theme}
            accentColor={accentColor}
          />

          <SettingToggleCard
            icon={UsersRound}
            title="Squadra"
            description="Attività e novità dalla tua squadra."
            value={teamAlerts}
            onChange={(value) => updateSetting("teamAlerts", value)}
            theme={theme}
            accentColor={accentColor}
          />
        </div>
      </div>
    </PanelFrame>
  );
}