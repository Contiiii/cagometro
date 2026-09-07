import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  BellRing,
  ChevronDown,
  ChevronRight,
  Cloud,
  Download,
  Info,
  LogOut,
  Mail,
  Moon,
  Palette,
  Pencil,
  RefreshCw,
  Save,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  User,
  UsersRound,
  Vibrate,
  Wand2,
  X,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import Header from "../components/HeaderTest";
import BottomNav from "../components/BottomNavTest";

const accentOptions = [
  { id: "pink", label: "Rosa classico", color: "#ec4899" },
  { id: "amber", label: "Ambra sospetta", color: "#f59e0b" },
  { id: "emerald", label: "Verde compost", color: "#10b981" },
  { id: "violet", label: "Viola illegale", color: "#8b5cf6" },
];


export default function CagometroSettings() {
  const prefersReducedMotion = useReducedMotion();

  const [themeMode, setThemeMode] = useState("system");
  const [systemPrefersDark] = useState(true);
  const [accent, setAccent] = useState("pink");

  const [dailyReminder, setDailyReminder] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);
  const [teamAlerts, setTeamAlerts] = useState(false);

  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [compactStats, setCompactStats] = useState(false);

  const [syncEnabled, setSyncEnabled] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [syncState, setSyncState] = useState("Sincronizzato 2 min fa");

  const [expandedPanels, setExpandedPanels] = useState({
    preferences: true,
    notifications: true,
    privacy: false,
    backup: false,
    account: false,
    about: false,
  });

  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [dangerModal, setDangerModal] = useState(null);
  const [toast, setToast] = useState(null);

  const [profile, setProfile] = useState({
    name: "Andrea Composti",
    email: "andrea@cagometro.app",
    xp: 2480,
    level: 14,
    team: "Cago Legends",
  });

  const [draftProfile, setDraftProfile] = useState(profile);

  const resolvedDark =
    themeMode === "system" ? systemPrefersDark : themeMode === "dark";

  const theme = resolvedDark
    ? {
        app: "bg-[#0b0b10] text-zinc-100",
        surface: "border-white/[0.08] bg-zinc-900/80",
        elevated: "border-white/[0.08] bg-[#17171d]",
        soft: "border-white/[0.07] bg-white/[0.035]",
        text: "text-zinc-50",
        muted: "text-zinc-400",
        subtle: "text-zinc-500",
        header: "border-white/[0.07] bg-[#0b0b10]/80",
        dangerSoft: "border-rose-500/20 bg-rose-500/10 text-rose-300",
        modal: "border-white/[0.09] bg-[#17171b]",
      }
    : {
        app: "bg-[#f7f3f1] text-zinc-900",
        surface: "border-zinc-200/80 bg-white/90",
        elevated: "border-zinc-200/80 bg-[#fffaf7]",
        soft: "border-zinc-900/[0.07] bg-zinc-900/[0.035]",
        text: "text-zinc-950",
        muted: "text-zinc-600",
        subtle: "text-zinc-500",
        header: "border-zinc-900/[0.07] bg-[#f7f3f1]/80",
        dangerSoft: "border-rose-500/20 bg-rose-500/10 text-rose-600",
        modal: "border-zinc-900/[0.09] bg-[#fdfbf9]",
      };

  const accentColor = useMemo(
    () => accentOptions.find((item) => item.id === accent)?.color ?? "#ec4899",
    [accent],
  );

  const completedSetupCount = [
    themeMode,
    accent,
    dailyReminder,
    syncEnabled,
    profile.name,
  ].filter(Boolean).length;

  const overallSetupProgress = Math.round((completedSetupCount / 5) * 100);

  const togglePanel = (key) => {
    setExpandedPanels((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const runSync = () => {
    setSyncState("Sincronizzazione in corso...");

    window.setTimeout(() => {
      setSyncState("Sincronizzato ora");
      showToast("Backup aggiornato");
    }, 1100);
  };

  const saveProfile = () => {
    setProfile(draftProfile);
    setProfileEditorOpen(false);
    showToast("Profilo aggiornato");
  };

  const handleDangerAction = () => {
    if (dangerModal === "logout") {
      showToast("Disconnessione simulata");
    }

    if (dangerModal === "leave-team") {
      setProfile((current) => ({ ...current, team: "Nessuna squadra" }));
      showToast("Hai lasciato la squadra");
    }

    if (dangerModal === "delete-data") {
      showToast("Eliminazione dati simulata");
    }

    if (dangerModal === "delete-account") {
      showToast("Richiesta eliminazione account simulata");
    }

    setDangerModal(null);
  };

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
      style={{ "--accent": accentColor }}
    >
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-xl ${theme.header}`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            aria-label="Torna indietro"
            className={`flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
            style={{ "--tw-ring-color": accentColor }}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
            Indietro
          </button>

          <div className="text-center">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${theme.subtle}`}>
              Cagometro
            </p>
            <p className={`text-[17px] font-bold tracking-tight ${theme.text}`}>
              Impostazioni
            </p>
          </div>

          <button
            type="button"
            onClick={runSync}
            aria-label="Sincronizza adesso"
            className={`grid h-11 w-11 place-items-center rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
            style={{ "--tw-ring-color": accentColor }}
          >
            <RefreshCw className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="space-y-5">
            <section className={`relative overflow-hidden rounded-[2rem] border p-5 sm:p-7 ${theme.surface}`}>
              <div
                className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full blur-3xl"
                style={{ backgroundColor: `${accentColor}22` }}
              />
              <div className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-amber-400/[0.08] blur-3xl" />

              <div className="relative flex items-start gap-4">
                <div
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.45rem] text-2xl font-black text-white shadow-[0_12px_28px_rgba(0,0,0,0.16)]"
                  style={{ backgroundColor: accentColor }}
                >
                  AC
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${theme.muted}`}>
                    Profilo
                  </p>
                  <h1 className={`mt-1 truncate text-2xl font-black tracking-[-0.05em] ${theme.text}`}>
                    {profile.name}
                  </h1>
                  <p className={`mt-1 truncate text-sm ${theme.muted}`}>
                    {profile.email}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className="rounded-full px-3 py-1.5 text-xs font-extrabold text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      Livello {profile.level}
                    </span>
                    <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${theme.soft}`}>
                      {profile.xp} XP
                    </span>
                    <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${theme.soft}`}>
                      {profile.team}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDraftProfile(profile);
                    setProfileEditorOpen(true);
                  }}
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
                  style={{ "--tw-ring-color": accentColor }}
                  aria-label="Modifica profilo"
                >
                  <Pencil className="h-5 w-5" strokeWidth={2.2} />
                </button>
              </div>

              <div className={`relative mt-6 rounded-[1.4rem] border p-4 ${theme.soft}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={`text-sm font-bold ${theme.text}`}>
                      Assetto dell’account
                    </p>
                    <p className={`mt-1 text-xs font-medium ${theme.muted}`}>
                      Hai già impostato quasi tutto senza fare troppo rumore.
                    </p>
                  </div>
                  <span
                    className="text-sm font-black"
                    style={{ color: accentColor }}
                  >
                    {overallSetupProgress}%
                  </span>
                </div>

                <div className={`mt-4 h-2 overflow-hidden rounded-full ${resolvedDark ? "bg-white/[0.07]" : "bg-zinc-900/[0.07]"}`}>
                  <motion.div
                    initial={false}
                    animate={{ width: `${overallSetupProgress}%` }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.55 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
              </div>
            </section>

            <section className={`overflow-hidden rounded-[1.8rem] border ${theme.surface}`}>
              <button
                type="button"
                onClick={() => togglePanel("preferences")}
                className="flex min-h-[72px] w-full items-center justify-between gap-4 px-5 text-left sm:px-7"
              >
                <div className="flex items-center gap-4">
                  <div className={`grid h-12 w-12 place-items-center rounded-[1.15rem] ${theme.soft}`}>
                    <Palette className="h-5 w-5" strokeWidth={2.2} style={{ color: accentColor }} />
                  </div>
                  <div>
                    <p className={`text-base font-black ${theme.text}`}>
                      Aspetto e preferenze
                    </p>
                    <p className={`mt-1 text-xs font-medium ${theme.muted}`}>
                      Tema, colore principale, vibrazione e animazioni.
                    </p>
                  </div>
                </div>

                <motion.span
                  animate={{ rotate: expandedPanels.preferences ? 180 : 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                >
                  <ChevronDown className={`h-5 w-5 ${theme.muted}`} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {expandedPanels.preferences && (
                  <motion.div
                    initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
                    className="overflow-hidden"
                  >
                    <div className={`border-t px-5 pb-5 pt-4 sm:px-7 ${resolvedDark ? "border-white/[0.07]" : "border-zinc-900/[0.07]"}`}>
                      <div className="grid gap-4">
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}>
                            Tema
                          </p>

                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {[
                              { id: "light", label: "Chiaro", icon: Sun },
                              { id: "dark", label: "Scuro", icon: Moon },
                              { id: "system", label: "Auto", icon: Smartphone },
                            ].map((option) => {
                              const Icon = option.icon;
                              const active = themeMode === option.id;

                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => setThemeMode(option.id)}
                                  aria-pressed={active}
                                  className={`min-h-[72px] rounded-[1.2rem] border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 ${
                                    active ? "" : theme.soft
                                  }`}
                                  style={{
                                    borderColor: active ? accentColor : undefined,
                                    boxShadow: active
                                      ? `0 0 0 1px ${accentColor} inset`
                                      : undefined,
                                    "--tw-ring-color": accentColor,
                                  }}
                                >
                                  <Icon
                                    className="h-5 w-5"
                                    strokeWidth={2.2}
                                    style={{ color: active ? accentColor : undefined }}
                                  />
                                  <p className={`mt-3 text-sm font-black ${theme.text}`}>
                                    {option.label}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <p className={`text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}>
                            Colore distintivo
                          </p>

                          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                            {accentOptions.map((option) => {
                              const active = accent === option.id;

                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => setAccent(option.id)}
                                  aria-label={option.label}
                                  aria-pressed={active}
                                  className={`flex min-w-[104px] shrink-0 items-center gap-3 rounded-full border px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
                                  style={{
                                    borderColor: active ? option.color : undefined,
                                    "--tw-ring-color": option.color,
                                  }}
                                >
                                  <span
                                    className="h-6 w-6 rounded-full"
                                    style={{ backgroundColor: option.color }}
                                  />
                                  <span className={`text-xs font-extrabold ${theme.text}`}>
                                    {option.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <SettingToggleCard
                            icon={Vibrate}
                            title="Vibrazione"
                            description="Un colpetto tattile quando tocchi ciò che conta."
                            value={vibrationEnabled}
                            onChange={setVibrationEnabled}
                            theme={theme}
                            accentColor={accentColor}
                          />

                          <SettingToggleCard
                            icon={Sparkles}
                            title="Animazioni"
                            description="Piccoli movimenti. Nessun balletto gratuito."
                            value={animationsEnabled}
                            onChange={setAnimationsEnabled}
                            theme={theme}
                            accentColor={accentColor}
                          />

                          <SettingToggleCard
                            icon={Wand2}
                            title="Statistiche compatte"
                            description="Più informazioni, meno aria teatrale."
                            value={compactStats}
                            onChange={setCompactStats}
                            theme={theme}
                            accentColor={accentColor}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <section className={`overflow-hidden rounded-[1.8rem] border ${theme.surface}`}>
              <button
                type="button"
                onClick={() => togglePanel("notifications")}
                className="flex min-h-[72px] w-full items-center justify-between gap-4 px-5 text-left sm:px-7"
              >
                <div className="flex items-center gap-4">
                  <div className={`grid h-12 w-12 place-items-center rounded-[1.15rem] ${theme.soft}`}>
                    <BellRing className="h-5 w-5" strokeWidth={2.2} style={{ color: accentColor }} />
                  </div>
                  <div>
                    <p className={`text-base font-black ${theme.text}`}>
                      Notifiche e promemoria
                    </p>
                    <p className={`mt-1 text-xs font-medium ${theme.muted}`}>
                      Solo ciò che ti aiuta davvero a non sparire dai radar.
                    </p>
                  </div>
                </div>

                <motion.span
                  animate={{ rotate: expandedPanels.notifications ? 180 : 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                >
                  <ChevronDown className={`h-5 w-5 ${theme.muted}`} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {expandedPanels.notifications && (
                  <motion.div
                    initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
                    className="overflow-hidden"
                  >
                    <div className={`border-t px-5 pb-5 pt-4 sm:px-7 ${resolvedDark ? "border-white/[0.07]" : "border-zinc-900/[0.07]"}`}>
                      <div className="grid gap-3">
                        <SettingToggleRow
                          icon={Bell}
                          title="Promemoria giornaliero"
                          description="Il classico “ehi, esisti ancora?”."
                          value={dailyReminder}
                          onChange={setDailyReminder}
                          accentColor={accentColor}
                          theme={theme}
                        />

                        <SettingToggleRow
                          icon={RefreshCw}
                          title="Avvisi streak"
                          description="Quando la serie è viva e chiede rispetto."
                          value={streakAlerts}
                          onChange={setStreakAlerts}
                          accentColor={accentColor}
                          theme={theme}
                        />

                        <SettingToggleRow
                          icon={Trophy}
                          title="Traguardi sbloccati"
                          description="Per celebrare i momenti in cui fai sul serio."
                          value={achievementAlerts}
                          onChange={setAchievementAlerts}
                          accentColor={accentColor}
                          theme={theme}
                        />

                        <SettingToggleRow
                          icon={UsersRound}
                          title="Notifiche di squadra"
                          description="Quando il team chiama, almeno lo sai."
                          value={teamAlerts}
                          onChange={setTeamAlerts}
                          accentColor={accentColor}
                          theme={theme}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </section>

          <section className="space-y-5">
            <QuickActionPanel
              theme={theme}
              accentColor={accentColor}
              syncState={syncState}
              syncEnabled={syncEnabled}
              setSyncEnabled={setSyncEnabled}
              autoBackup={autoBackup}
              setAutoBackup={setAutoBackup}
              onSyncNow={runSync}
            />

            <ExpandableCard
              title="Privacy e sicurezza"
              description="Controlli che contano, senza tono da ministero."
              icon={Shield}
              panelKey="privacy"
              expandedPanels={expandedPanels}
              togglePanel={togglePanel}
              theme={theme}
              accentColor={accentColor}
              prefersReducedMotion={prefersReducedMotion}
            >
              <div className="grid gap-3">
                <MiniAction
                  icon={Mail}
                  title="Email di accesso"
                  subtitle="andrea@cagometro.app"
                  theme={theme}
                />
                <MiniAction
                  icon={Shield}
                  title="Verifica dispositivi"
                  subtitle="Ultimo accesso verificato oggi"
                  theme={theme}
                />
                <MiniAction
                  icon={Download}
                  title="Esporta dati"
                  subtitle="CSV + riepilogo locale"
                  theme={theme}
                  actionLabel="Esporta"
                  onAction={() => showToast("Esportazione simulata")}
                />
              </div>
            </ExpandableCard>

            <ExpandableCard
              title="Backup e sincronizzazione"
              description="Cloud, salvataggi e stato della situazione."
              icon={Cloud}
              panelKey="backup"
              expandedPanels={expandedPanels}
              togglePanel={togglePanel}
              theme={theme}
              accentColor={accentColor}
              prefersReducedMotion={prefersReducedMotion}
            >
              <div className="grid gap-3">
                <SettingToggleRow
                  icon={Cloud}
                  title="Sincronizzazione account"
                  description="Tieni i dati allineati tra dispositivi."
                  value={syncEnabled}
                  onChange={setSyncEnabled}
                  accentColor={accentColor}
                  theme={theme}
                />
                <SettingToggleRow
                  icon={Save}
                  title="Backup automatico"
                  description="Una rete di sicurezza senza drammi."
                  value={autoBackup}
                  onChange={setAutoBackup}
                  accentColor={accentColor}
                  theme={theme}
                />
                <button
                  type="button"
                  onClick={runSync}
                  className={`flex min-h-12 items-center justify-between rounded-[1.2rem] border px-4 text-left transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
                  style={{ "--tw-ring-color": accentColor }}
                >
                  <div>
                    <p className={`text-sm font-black ${theme.text}`}>
                      Sincronizza adesso
                    </p>
                    <p className={`mt-1 text-xs font-medium ${theme.muted}`}>
                      {syncState}
                    </p>
                  </div>
                  <RefreshCw className="h-5 w-5" strokeWidth={2.2} style={{ color: accentColor }} />
                </button>
              </div>
            </ExpandableCard>

            <ExpandableCard
              title="Account e assistenza"
              description="Le cose importanti, ma non urlate."
              icon={User}
              panelKey="account"
              expandedPanels={expandedPanels}
              togglePanel={togglePanel}
              theme={theme}
              accentColor={accentColor}
              prefersReducedMotion={prefersReducedMotion}
            >
              <div className="grid gap-3">
                <MiniAction
                  icon={UsersRound}
                  title="Gestisci squadra"
                  subtitle={profile.team}
                  theme={theme}
                  actionLabel="Apri"
                  onAction={() => showToast("Gestione squadra simulata")}
                />
                <MiniAction
                  icon={Info}
                  title="Assistenza e feedback"
                  subtitle="Versione 1.8.2 · Rispondiamo con dignità"
                  theme={theme}
                  actionLabel="Scrivi"
                  onAction={() => showToast("Centro assistenza simulato")}
                />

                <div className={`mt-2 rounded-[1.5rem] border p-4 ${theme.dangerSoft}`}>
                  <p className="text-sm font-black">Azioni delicate</p>
                  <p className="mt-1 text-xs font-medium opacity-80">
                    Sono qui sotto apposta: visibili, ma non in mezzo al traffico.
                  </p>

                  <div className="mt-4 grid gap-2">
                    <DangerButton
                      icon={LogOut}
                      label="Disconnetti"
                      onClick={() => setDangerModal("logout")}
                    />
                    <DangerButton
                      icon={UsersRound}
                      label="Esci dalla squadra"
                      onClick={() => setDangerModal("leave-team")}
                    />
                    <DangerButton
                      icon={Trash2}
                      label="Elimina i dati locali"
                      onClick={() => setDangerModal("delete-data")}
                    />
                    <DangerButton
                      icon={X}
                      label="Elimina account"
                      onClick={() => setDangerModal("delete-account")}
                    />
                  </div>
                </div>
              </div>
            </ExpandableCard>

            <ExpandableCard
              title="Informazioni sull’app"
              description="Le note di servizio, senza trasformarle in burocrazia."
              icon={Info}
              panelKey="about"
              expandedPanels={expandedPanels}
              togglePanel={togglePanel}
              theme={theme}
              accentColor={accentColor}
              prefersReducedMotion={prefersReducedMotion}
            >
              <div className="grid gap-3">
                {[
                  ["Versione installata", "1.8.2"],
                  ["Build", "240906-beta"],
                  ["Tema attivo", themeMode === "system" ? "Automatico" : themeMode === "dark" ? "Scuro" : "Chiaro"],
                  ["Accento", accentOptions.find((item) => item.id === accent)?.label ?? "Rosa classico"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between rounded-[1.15rem] border px-4 py-3 ${theme.soft}`}
                  >
                    <span className={`text-sm font-bold ${theme.text}`}>{label}</span>
                    <span className={`text-xs font-extrabold ${theme.muted}`}>{value}</span>
                  </div>
                ))}
              </div>
            </ExpandableCard>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {profileEditorOpen && (
          <ModalShell
            title="Modifica profilo"
            theme={theme}
            onClose={() => setProfileEditorOpen(false)}
            prefersReducedMotion={prefersReducedMotion}
          >
            <div className="grid gap-4">
              <Field
                label="Nome"
                value={draftProfile.name}
                onChange={(value) =>
                  setDraftProfile((current) => ({ ...current, name: value }))
                }
              />
              <Field
                label="Email"
                value={draftProfile.email}
                onChange={(value) =>
                  setDraftProfile((current) => ({ ...current, email: value }))
                }
              />
              <Field
                label="Squadra"
                value={draftProfile.team}
                onChange={(value) =>
                  setDraftProfile((current) => ({ ...current, team: value }))
                }
              />

              <button
                type="button"
                onClick={saveProfile}
                className="mt-2 flex min-h-14 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] focus-visible:outline-none focus-visible:ring-4"
                style={{
                  backgroundColor: accentColor,
                  "--tw-ring-color": `${accentColor}55`,
                }}
              >
                <Save className="h-5 w-5" strokeWidth={2.3} />
                Salva modifiche
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dangerModal && (
          <ModalShell
            title="Conferma azione"
            theme={theme}
            onClose={() => setDangerModal(null)}
            prefersReducedMotion={prefersReducedMotion}
          >
            <div className="rounded-[1.4rem] border border-rose-500/20 bg-rose-500/10 p-4 text-rose-500">
              <p className="text-sm font-black">
                {dangerModal === "logout" && "Vuoi davvero disconnetterti?"}
                {dangerModal === "leave-team" && "Vuoi davvero uscire dalla squadra?"}
                {dangerModal === "delete-data" && "Vuoi eliminare i dati locali?"}
                {dangerModal === "delete-account" && "Vuoi eliminare l’account?"}
              </p>
              <p className="mt-2 text-xs font-medium opacity-80">
                Questa azione è trattata come delicata e richiede un passaggio in più.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDangerModal(null)}
                className={`min-h-12 rounded-2xl border px-4 text-sm font-bold ${theme.soft}`}
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={handleDangerAction}
                className="min-h-12 rounded-2xl bg-rose-500 px-4 text-sm font-extrabold text-white"
              >
                Conferma
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
            className="fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4"
            aria-live="polite"
          >
            <div
              className="rounded-full px-4 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(0,0,0,0.22)]"
              style={{ backgroundColor: accentColor }}
            >
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
      className={`rounded-[1.25rem] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
      style={{ "--tw-ring-color": accentColor }}
    >
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-5 w-5" strokeWidth={2.2} style={{ color: accentColor }} />
        <TinySwitch value={value} accentColor={accentColor} />
      </div>
      <p className={`mt-4 text-sm font-black ${theme.text}`}>{title}</p>
      <p className={`mt-1 text-xs font-medium leading-relaxed ${theme.muted}`}>
        {description}
      </p>
    </button>
  );
}

function SettingToggleRow({
  icon: Icon,
  title,
  description,
  value,
  onChange,
  accentColor,
  theme,
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={`flex min-h-[72px] items-center justify-between gap-4 rounded-[1.25rem] border px-4 text-left transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
      style={{ "--tw-ring-color": accentColor }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} style={{ color: accentColor }} />
        </div>

        <div className="min-w-0">
          <p className={`truncate text-sm font-black ${theme.text}`}>{title}</p>
          <p className={`mt-1 text-xs font-medium leading-relaxed ${theme.muted}`}>
            {description}
          </p>
        </div>
      </div>

      <TinySwitch value={value} accentColor={accentColor} />
    </button>
  );
}

function TinySwitch({ value, accentColor }) {
  return (
    <span
      className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
        value ? "" : "bg-zinc-400/30"
      }`}
      style={{ backgroundColor: value ? accentColor : undefined }}
    >
      <motion.span
        animate={{ x: value ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="h-5 w-5 rounded-full bg-white shadow-sm"
      />
    </span>
  );
}

function QuickActionPanel({
  theme,
  accentColor,
  syncState,
  syncEnabled,
  setSyncEnabled,
  autoBackup,
  setAutoBackup,
  onSyncNow,
}) {
  return (
    <section className={`overflow-hidden rounded-[1.9rem] border p-5 ${theme.surface}`}>
      <p className={`text-sm font-semibold ${theme.muted}`}>Scorciatoie utili</p>
      <h2 className={`mt-1 text-2xl font-black tracking-[-0.055em] ${theme.text}`}>
        Le cose che tocchi davvero
      </h2>

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          onClick={onSyncNow}
          className="flex min-h-[76px] items-center justify-between rounded-[1.35rem] border px-4 text-left transition focus-visible:outline-none focus-visible:ring-2"
          style={{
            borderColor: `${accentColor}33`,
            backgroundColor: `${accentColor}10`,
            "--tw-ring-color": accentColor,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 place-items-center rounded-[1rem]"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Cloud className="h-5 w-5" strokeWidth={2.2} style={{ color: accentColor }} />
            </div>
            <div>
              <p className={`text-sm font-black ${theme.text}`}>Sincronizza ora</p>
              <p className={`mt-1 text-xs font-medium ${theme.muted}`}>{syncState}</p>
            </div>
          </div>

          <ChevronRight className="h-5 w-5" strokeWidth={2.4} style={{ color: accentColor }} />
        </button>

        <div className="grid gap-3 sm:grid-cols-2">
          <SettingToggleCard
            icon={Cloud}
            title="Sync attivo"
            description="I dati seguono il tuo account."
            value={syncEnabled}
            onChange={setSyncEnabled}
            theme={theme}
            accentColor={accentColor}
          />
          <SettingToggleCard
            icon={Save}
            title="Backup auto"
            description="Salvataggio discreto, ma puntuale."
            value={autoBackup}
            onChange={setAutoBackup}
            theme={theme}
            accentColor={accentColor}
          />
        </div>
      </div>
    </section>
  );
}

function ExpandableCard({
  title,
  description,
  icon: Icon,
  panelKey,
  expandedPanels,
  togglePanel,
  theme,
  accentColor,
  prefersReducedMotion,
  children,
}) {
  return (
    <section className={`overflow-hidden rounded-[1.8rem] border ${theme.surface}`}>
      <button
        type="button"
        onClick={() => togglePanel(panelKey)}
        className="flex min-h-[72px] w-full items-center justify-between gap-4 px-5 text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`grid h-12 w-12 place-items-center rounded-[1.15rem] ${theme.soft}`}>
            <Icon className="h-5 w-5" strokeWidth={2.2} style={{ color: accentColor }} />
          </div>
          <div>
            <p className={`text-base font-black ${theme.text}`}>{title}</p>
            <p className={`mt-1 text-xs font-medium ${theme.muted}`}>{description}</p>
          </div>
        </div>

        <motion.span
          animate={{ rotate: expandedPanels[panelKey] ? 180 : 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        >
          <ChevronDown className={`h-5 w-5 ${theme.muted}`} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expandedPanels[panelKey] && (
          <motion.div
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
            className="overflow-hidden"
          >
            <div className={`border-t px-5 pb-5 pt-4 ${theme.app.includes("#0b0b10") ? "border-white/[0.07]" : "border-zinc-900/[0.07]"}`}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function MiniAction({
  icon: Icon,
  title,
  subtitle,
  theme,
  actionLabel = null,
  onAction = null,
}) {
  return (
    <div className={`flex min-h-12 items-center justify-between gap-4 rounded-[1.15rem] border px-4 py-3 ${theme.soft}`}>
      <div className="flex min-w-0 items-center gap-3">
        <Icon className={`h-4.5 w-4.5 shrink-0 ${theme.muted}`} strokeWidth={2.2} />
        <div className="min-w-0">
          <p className={`truncate text-sm font-black ${theme.text}`}>{title}</p>
          <p className={`mt-1 text-xs font-medium ${theme.muted}`}>{subtitle}</p>
        </div>
      </div>

      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-extrabold text-white"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function DangerButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center justify-between rounded-2xl border border-rose-500/20 bg-transparent px-4 text-left text-sm font-bold text-current transition hover:bg-rose-500/10"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
        {label}
      </span>
      <ChevronRight className="h-4.5 w-4.5" strokeWidth={2.2} />
    </button>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-2xl border border-zinc-300/70 bg-white/80 px-4 text-sm font-medium text-zinc-900 outline-none focus:border-pink-500"
      />
    </label>
  );
}

function ModalShell({
  title,
  theme,
  onClose,
  prefersReducedMotion,
  children,
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-3 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className={`w-full max-w-md rounded-[2rem] border p-6 shadow-2xl sm:p-7 ${theme.modal}`}
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-sm font-semibold ${theme.muted}`}>Impostazioni</p>
            <h2
              id="settings-modal-title"
              className={`mt-1 text-2xl font-black tracking-tight ${theme.text}`}
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className={`grid h-11 w-11 place-items-center rounded-2xl border focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </motion.section>
    </motion.div>
  );
}