import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  BellRing,
  ChevronRight,
  Cloud,
  Download,
  Info,
  LogIn,
  LogOut,
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
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useProfile } from "../hooks/useProfile";
import { useAuth } from "../hooks/useAuth";

import { useTeam } from "../hooks/useTeam";

const accentOptions = [
  { id: "pink", label: "Rosa classico", color: "#ec4899" },
  { id: "amber", label: "Ambra sospetta", color: "#f59e0b" },
  { id: "emerald", label: "Verde compost", color: "#10b981" },
  { id: "violet", label: "Viola illegale", color: "#8b5cf6" },
];

const settingsSections = [
  {
    id: "appearance",
    label: "Aspetto",
    description: "Tema, colore e movimento",
    icon: Palette,
    disabled: true,
  },
  {
    id: "notifications",
    label: "Notifiche",
    description: "Promemoria e avvisi",
    icon: BellRing,
    disabled: true,
  },
  {
    id: "system",
    label: "Sistema",
    description: "Stato dell'app",
    icon: Cloud,
    disabled: false,
  },
  {
    id: "privacy",
    label: "Privacy",
    description: "Esportazione e sicurezza",
    icon: Shield,
    disabled: true,
  },
  {
    id: "account",
    label: "Account",
    description: "Profilo e accesso",
    icon: User,
    disabled: false,
  },
];

export default function CagometroSettings() {
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const { user, login, logout } = useAuth();
  const { team } = useTeam();

  const profileTeam = team?.name ?? null;

  const profileName = profile?.displayName ?? profile?.display_name ?? "Utente";

  const profileAvatar = profile?.avatarUrl ?? profile?.avatar_url ?? null;

  const profileLevel = profile?.level ?? 1;
  const profileXp = profile?.xp ?? 0;

const profileInitial =
  profileName.trim().slice(0, 1).toUpperCase() || "U";

  const [themeMode, setThemeMode] = useState("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState(true);
  const [accent, setAccent] = useState("pink");
  const [activeSection, setActiveSection] = useState("system");

  const [dailyReminder, setDailyReminder] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);
  const [teamAlerts, setTeamAlerts] = useState(false);

  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [compactStats, setCompactStats] = useState(false);
  const cloudEnabled = Boolean(user);

 const syncState = cloudEnabled
  ? "Sincronizzazione automatica attiva"
  : "Sincronizzazione non disponibile";

  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [dangerModal, setDangerModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const mobileTabsRef = useRef(null);
  const mobileTabButtonsRef = useRef({});

  const [draftProfile, setDraftProfile] = useState({
    name: "",
    email: "",
    team: "",
  });

  const resolvedDark =
    themeMode === "system" ? systemPrefersDark : themeMode === "dark";

  const accentColor = useMemo(
    () => accentOptions.find((item) => item.id === accent)?.color ?? "#ec4899",
    [accent],
  );

  const theme = resolvedDark
    ? {
        app: "bg-[#09090c] text-zinc-100",
        surface: "border-white/[0.08] bg-[#121216]",
        elevated: "border-white/[0.09] bg-[#19191e]",
        soft: "border-white/[0.07] bg-white/[0.035]",
        text: "text-zinc-50",
        muted: "text-zinc-400",
        subtle: "text-zinc-500",
        header: "border-white/[0.07] bg-[#09090c]/80",
        modal: "border-white/[0.09] bg-[#17171b]",
        dangerSoft: "border-rose-500/20 bg-rose-500/10 text-rose-300",
        divider: "border-white/[0.07]",
      }
    : {
        app: "bg-[#f6f1ec] text-zinc-900",
        surface: "border-zinc-900/[0.08] bg-[#fffdfa]",
        elevated: "border-zinc-900/[0.08] bg-[#fff8f4]",
        soft: "border-zinc-900/[0.07] bg-zinc-900/[0.035]",
        text: "text-zinc-950",
        muted: "text-zinc-600",
        subtle: "text-zinc-500",
        header: "border-zinc-900/[0.07] bg-[#f6f1ec]/80",
        modal: "border-zinc-900/[0.09] bg-[#fffaf6]",
        dangerSoft: "border-rose-500/20 bg-rose-500/10 text-rose-600",
        divider: "border-zinc-900/[0.07]",
      };

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const syncSystemTheme = () => {
      setSystemPrefersDark(media.matches);
    };

    syncSystemTheme();
    media.addEventListener("change", syncSystemTheme);

    return () => media.removeEventListener("change", syncSystemTheme);
  }, []);

  useEffect(() => {
    const activeTab = mobileTabButtonsRef.current[activeSection];

    if (!activeTab) return;

    activeTab.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeSection]);

const completedSetupCount = [
  profileName !== "Utente",
  Boolean(user?.email),
].filter(Boolean).length;

const overallSetupProgress = Math.round(
  (completedSetupCount / 2) * 100,
);

  const showToast = (message) => {
    setToast(message);

    window.setTimeout(() => {
      setToast(null);
    }, 2200);
  };

  const openProfileEditor = () => {
    setDraftProfile({
      name: profileName === "Utente" ? "" : profileName,
      email: user?.email ?? "",
      team: profileTeam ?? "",
    });

    setProfileEditorOpen(true);
  };

  async function saveProfile() {
    const trimmedName = draftProfile.name.trim();

    if (!trimmedName) {
      showToast("Inserisci un nome valido");
      return;
    }

    try {
      setSaving(true);

      await updateProfile({
        displayName: trimmedName,
        avatarUrl: profileAvatar,
      });

      showToast("Profilo aggiornato");
      setProfileEditorOpen(false);
    } catch (error) {
      console.error(error);
      showToast("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  }

  async function handleDangerAction() {
    if (dangerModal !== "logout") {
      setDangerModal(null);
      return;
    }

    setDangerModal(null);

    try {
      await logout();
      navigate("/");  
      showToast("Ti sei disconnesso");
    } catch (error) {
      console.error("Errore durante il logout:", error);
      showToast("Non è stato possibile disconnettersi");
    }
  }

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
      style={{ "--accent": accentColor }}
    >
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-xl ${theme.header}`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
            style={{ "--tw-ring-color": accentColor }}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
            Indietro
          </button>

          <div className="text-center">
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.16em] ${theme.subtle}`}
            >
              Cagometro
            </p>
            <p className={`text-sm font-black tracking-tight ${theme.text}`}>
              Impostazioni
            </p>
          </div>

          <div
            role="status"
            aria-label="Sincronizzazione automatica attiva"
            title="Sincronizzazione automatica attiva"
            className={`relative grid h-11 w-11 place-items-center rounded-2xl border ${theme.soft}`}
          >
            <Cloud
              className="h-5 w-5"
              strokeWidth={2.2}
              style={{ color: accentColor }}
            />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-28 pt-6 sm:px-8 sm:pt-8">
        <section
          className={`relative overflow-hidden rounded-[2.1rem] border p-5 sm:p-7 ${theme.surface}`}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
            style={{ backgroundColor: `${accentColor}1f` }}
          />

          <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-amber-400/[0.08] blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div
                className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[1.4rem] text-2xl font-black text-white shadow-[0_14px_30px_rgba(0,0,0,0.16)]"
                style={{ backgroundColor: accentColor }}
              >
                {profileAvatar ? (
                  <img
                    src={profileAvatar}
                    alt={profileName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profileInitial
                )}

                <span className="absolute bottom-1.5 right-1.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`text-xs font-bold uppercase tracking-[0.14em] ${theme.subtle}`}
                  >
                    Il tuo spazio
                  </p>

                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.06em] text-emerald-500">
                    Beta
                  </span>
                </div>

                <h1
                  className={`mt-1 truncate text-[clamp(1.65rem,4vw,2.2rem)] font-black tracking-[-0.06em] ${theme.text}`}
                >
                  {profileName}
                </h1>

                <p className={`mt-1 truncate text-sm ${theme.muted}`}>
                  {user?.email ?? "Nessuna email collegata"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge active={cloudEnabled}>
  {cloudEnabled ? "Cloud attivo" : "Cloud non disponibile"}
</StatusBadge>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-black ${theme.soft}`}
                  >
                    {profileTeam ?? "Nessuna squadra"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={openProfileEditor}
                className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 sm:w-auto ${theme.soft}`}
                style={{ "--tw-ring-color": accentColor }}
              >
                <Pencil className="h-4 w-4" strokeWidth={2.3} />
                Modifica profilo
              </button>

              {!user && (
                <button
                  type="button"
                  onClick={login}
                  className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 sm:w-auto ${theme.soft}`}
                >
                  <LogIn className="h-4 w-4" strokeWidth={2.3} />
                  Accedi con Google
                </button>
              )}
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ProfileMetric label="Livello" value={profileLevel} theme={theme} />

            <ProfileMetric
              label="Esperienza"
              value={`${profileXp} XP`}
              theme={theme}
            />

            <ProfileMetric
              label="Squadra"
              value={profileTeam ?? "—"}
              theme={theme}
              className="col-span-2 sm:col-span-1"
            />
          </div>

          <div
            className={`relative mt-5 rounded-[1.4rem] border p-4 ${theme.soft}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className={`text-sm font-black ${theme.text}`}>
                  Assetto dell’account
                </p>

<p
  className={`mt-1 text-xs font-medium leading-relaxed ${theme.muted}`}
>
  {overallSetupProgress === 100
    ? "Profilo pronto. Le informazioni principali sono complete."
    : "Completa le informazioni principali per preparare il profilo."}
</p>

              </div>

              <span
                className="shrink-0 text-lg font-black"
                style={{ color: accentColor }}
              >
                {overallSetupProgress}%
              </span>
            </div>

            <div
              className={`mt-4 h-2 overflow-hidden rounded-full ${
                resolvedDark ? "bg-white/[0.08]" : "bg-zinc-900/[0.08]"
              }`}
            >
              <motion.div
                initial={false}
                animate={{ width: `${overallSetupProgress}%` }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.55,
                }}
                className="h-full rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <nav
            aria-label="Categorie impostazioni"
            className={`h-fit overflow-hidden rounded-[1.8rem] border p-2 ${theme.surface}`}
          >
            <p
              className={`px-3 pb-3 pt-3 text-[10px] font-bold uppercase tracking-[0.15em] ${theme.subtle}`}
            >
              Configurazione
            </p>

            <div className="relative">
              <div
                ref={mobileTabsRef}
                className="flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:grid lg:gap-1 lg:overflow-visible"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {settingsSections.map((section) => {
                  const isDisabled = section.disabled;
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                    type="button"
                      key={section.id}
                      ref={(node) => {
                        if (node) {
                          mobileTabButtonsRef.current[section.id] = node;
                        } else {
                          delete mobileTabButtonsRef.current[section.id];
                        }
                      }}
                      disabled={isDisabled}
                      onClick={() => {
                        if (!isDisabled) {
                          setActiveSection(section.id);
                        }
                      }}
                      aria-pressed={isActive}
                      className={`flex min-h-14 min-w-[172px] shrink-0 items-center gap-3 rounded-2xl px-3 text-left transition focus-visible:outline-none focus-visible:ring-2 lg:min-w-0 ${
                        isDisabled
                          ? "cursor-not-allowed opacity-60"
                          : isActive
                            ? resolvedDark
                              ? "bg-zinc-100 text-zinc-950 shadow-sm"
                              : "bg-zinc-900 text-white shadow-sm"
                            : `${theme.muted} hover:bg-zinc-900/[0.04]`
                      }`}
                      style={{ "--tw-ring-color": accentColor }}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                          isActive && !isDisabled
                            ? resolvedDark
                              ? "bg-zinc-900/10"
                              : "bg-white/10"
                            : theme.soft
                        }`}
                      >
                        <Icon
                          className="h-4 w-4"
                          strokeWidth={2.3}
                          style={
                            !isActive || isDisabled
                              ? { color: accentColor }
                              : undefined
                          }
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black">
                          {section.label}
                        </span>

                        <span
                          className={`mt-0.5 block truncate text-[11px] font-medium ${
                            isActive && !isDisabled
                              ? resolvedDark
                                ? "text-zinc-600"
                                : "text-zinc-300"
                              : theme.subtle
                          }`}
                        >
                          {section.description}
                        </span>
                      </span>

                      {isDisabled && (
                        <span
                          className="hidden shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.05em] xl:inline-flex"
                          style={{
                            backgroundColor: `${accentColor}18`,
                            color: accentColor,
                          }}
                        >
                          Presto
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute inset-y-0 left-0 w-5 rounded-l-[1.4rem] bg-gradient-to-r from-black/10 to-transparent lg:hidden" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-7 rounded-r-[1.4rem] bg-gradient-to-l from-black/10 to-transparent lg:hidden" />
            </div>
          </nav>

          <AnimatePresence mode="wait">
            <motion.section
              key={activeSection}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
              }
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className={`min-w-0 rounded-[1.8rem] border p-5 sm:p-7 ${theme.surface}`}
            >
              {activeSection === "appearance" && (
                <AppearancePanel
                  theme={theme}
                  accent={accent}
                  setAccent={setAccent}
                  accentColor={accentColor}
                  themeMode={themeMode}
                  setThemeMode={setThemeMode}
                  vibrationEnabled={vibrationEnabled}
                  setVibrationEnabled={setVibrationEnabled}
                  animationsEnabled={animationsEnabled}
                  setAnimationsEnabled={setAnimationsEnabled}
                  compactStats={compactStats}
                  setCompactStats={setCompactStats}
                />
              )}

              {activeSection === "notifications" && (
                <NotificationsPanel
                  theme={theme}
                  accentColor={accentColor}
                  dailyReminder={dailyReminder}
                  setDailyReminder={setDailyReminder}
                  streakAlerts={streakAlerts}
                  setStreakAlerts={setStreakAlerts}
                  achievementAlerts={achievementAlerts}
                  setAchievementAlerts={setAchievementAlerts}
                  teamAlerts={teamAlerts}
                  setTeamAlerts={setTeamAlerts}
                />
              )}

              {activeSection === "system" && (
                <SystemPanel
  theme={theme}
  accentColor={accentColor}
  syncState={syncState}
  cloudEnabled={cloudEnabled}
/>
              )}

              {activeSection === "privacy" && (
                <PrivacyPanel theme={theme} accentColor={accentColor} />
              )}

              {activeSection === "account" && (
<AccountPanel
  theme={theme}
  accentColor={accentColor}
  themeMode={themeMode}
  accent={accent}
  onDanger={setDangerModal}
/>
              )}
            </motion.section>
          </AnimatePresence>
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
                accentColor={accentColor}
              />

              <Field
                label="Email"
                value={draftProfile.email}
                onChange={(value) =>
                  setDraftProfile((current) => ({ ...current, email: value }))
                }
                accentColor={accentColor}
                disabled
              />

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="mt-2 flex min-h-14 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] disabled:opacity-60"
                style={{
                  backgroundColor: accentColor,
                  "--tw-ring-color": `${accentColor}55`,
                }}
              >
                <Save className="h-5 w-5" strokeWidth={2.3} />
                {saving ? "Salvataggio…" : "Salva modifiche"}
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
                {dangerModal === "leave-team" &&
                  "Vuoi davvero uscire dalla squadra?"}
                {dangerModal === "delete-data" &&
                  "Vuoi eliminare i dati locali?"}
                {dangerModal === "delete-account" &&
                  "Vuoi eliminare l’account?"}
              </p>

              <p className="mt-2 text-xs font-medium opacity-80">
                Questa azione viene trattata come delicata e richiede una
                conferma esplicita.
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
            aria-live="polite"
            initial={
              prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 10, scale: 0.96 }
            }
            transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
            className="fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4"
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

function ProfileMetric({ label, value, theme, className = "" }) {
  return (
    <div
      className={`min-w-0 rounded-2xl border p-3 ${theme.soft} ${className}`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.11em] ${theme.subtle}`}
      >
        {label}
      </p>

      <p
        className={`mt-1 truncate text-sm font-black ${theme.text}`}
        title={String(value)}
      >
        {value}
      </p>
    </div>
  );
}

function AppearancePanel({
  theme,
  accent,
  setAccent,
  accentColor,
  themeMode,
  setThemeMode,
  vibrationEnabled,
  setVibrationEnabled,
  animationsEnabled,
  setAnimationsEnabled,
  compactStats,
  setCompactStats,
}) {
  const themeOptions = [
    { id: "light", label: "Chiaro", icon: Sun },
    { id: "dark", label: "Scuro", icon: Moon },
    { id: "system", label: "Auto", icon: Smartphone },
  ];

  return (
    <PanelFrame
      eyebrow="Aspetto"
      title="Come vuoi vederla"
      description="Tema, colore e piccoli dettagli che rendono l’app più tua."
      theme={theme}
    >
      <p
        className={`text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
      >
        Tema
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const active = themeMode === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setThemeMode(option.id)}
              aria-pressed={active}
              className={`min-h-[92px] rounded-[1.25rem] border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
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
              <p className={`mt-4 text-sm font-black ${theme.text}`}>
                {option.label}
              </p>
            </button>
          );
        })}
      </div>

      <p
        className={`mt-7 text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
      >
        Colore distintivo
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {accentOptions.map((option) => {
          const active = accent === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setAccent(option.id)}
              aria-pressed={active}
              className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
              style={{
                borderColor: active ? option.color : undefined,
                boxShadow: active
                  ? `0 0 0 1px ${option.color} inset`
                  : undefined,
                "--tw-ring-color": option.color,
              }}
            >
              <span className="flex items-center gap-3">
                <span
                  className="h-7 w-7 rounded-full shadow-sm"
                  style={{ backgroundColor: option.color }}
                />
                <span className={`text-sm font-black ${theme.text}`}>
                  {option.label}
                </span>
              </span>

              {active && <CheckMark color={option.color} />}
            </button>
          );
        })}
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <SettingToggleCard
          icon={Vibrate}
          title="Vibrazione"
          description="Un feedback tattile quando tocchi ciò che conta."
          value={vibrationEnabled}
          onChange={setVibrationEnabled}
          theme={theme}
          accentColor={accentColor}
        />

        <SettingToggleCard
          icon={Sparkles}
          title="Animazioni"
          description="Piccoli movimenti, senza balletto gratuito."
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
    </PanelFrame>
  );
}

function NotificationsPanel({
  theme,
  accentColor,
  dailyReminder,
  setDailyReminder,
  streakAlerts,
  setStreakAlerts,
  achievementAlerts,
  setAchievementAlerts,
  teamAlerts,
  setTeamAlerts,
}) {
  return (
    <PanelFrame
      eyebrow="Notifiche"
      title="Solo quando serve"
      description="Avvisi utili, senza trasformare il telefono in una sirena."
      theme={theme}
    >
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
          icon={Sparkles}
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
    </PanelFrame>
  );
}

function PrivacyPanel({ theme, accentColor }) {
  return (
    <PanelFrame
      eyebrow="Privacy"
      title="Dati sotto controllo"
      description="Strumenti chiari per esportare informazioni e controllare gli accessi."
      theme={theme}
    >
      <div className="grid gap-3">
        <ActionRow
          icon={Download}
          title="Esporta dati"
          description="CSV riepilogativo locale."
          actionLabel="Prossimamente"
          theme={theme}
          accentColor={accentColor}
          disabled
        />

        <ActionRow
          icon={Shield}
          title="Verifica dispositivi"
          description="Controllo delle sessioni e dei dispositivi collegati."
          actionLabel="Prossimamente"
          theme={theme}
          accentColor={accentColor}
          disabled
        />

        <ActionRow
          icon={Info}
          title="Informativa privacy"
          description="Come vengono trattati i dati dell’account."
          actionLabel="Prossimamente"
          theme={theme}
          accentColor={accentColor}
          disabled
        />
      </div>
    </PanelFrame>
  );
}

function AccountPanel({ theme, accentColor, themeMode, accent, onDanger }) {
  const accentLabel =
    accentOptions.find((item) => item.id === accent)?.label ?? "Rosa classico";

  return (
    <PanelFrame
      eyebrow="Account"
      title="Le cose importanti"
      description="Informazioni tecniche, accesso e funzionalità in arrivo."
      theme={theme}
    >
      <div className="grid gap-3">
        <ActionRow
          icon={Info}
          title="Assistenza e feedback"
          description="Centro assistenza e segnalazione problemi."
          actionLabel="Prossimamente"
          theme={theme}
          accentColor={accentColor}
          disabled
        />
      </div>

      <div className={`mt-6 rounded-[1.5rem] border p-4 ${theme.soft}`}>
        <p
          className={`text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
        >
          Informazioni app
        </p>

        <div className="mt-3 grid gap-2">
          <InfoRow label="Versione installata" value="1.8.2" theme={theme} />
          <InfoRow label="Build" value="240906-beta" theme={theme} />
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
          <InfoRow label="Accento" value={accentLabel} theme={theme} />
        </div>
      </div>

      <div className={`mt-6 rounded-[1.5rem] border p-4 ${theme.dangerSoft}`}>
        <p className="text-sm font-black">Azioni delicate</p>
        <p className="mt-1 text-xs font-medium leading-relaxed opacity-80">
          Sono qui apposta: visibili, ma separate dal resto delle impostazioni.
        </p>

        <div className="mt-4 grid gap-2">
          <DangerButton
            icon={LogOut}
            label="Disconnetti"
            onClick={() => onDanger("logout")}
          />

          <DangerButton icon={UsersRound} label="Esci dalla squadra" disabled />

          <DangerButton icon={Trash2} label="Elimina dati locali" disabled />

          <DangerButton icon={X} label="Elimina account" disabled />
        </div>
      </div>
    </PanelFrame>
  );
}

function PanelFrame({ eyebrow, title, description, theme, children }) {
  return (
    <>
      <p
        className={`text-xs font-bold uppercase tracking-[0.14em] ${theme.subtle}`}
      >
        {eyebrow}
      </p>

      <h2
        className={`mt-2 text-[clamp(1.75rem,4vw,2.35rem)] font-black tracking-[-0.06em] ${theme.text}`}
      >
        {title}
      </h2>

      <p className={`mt-2 max-w-[60ch] text-sm leading-relaxed ${theme.muted}`}>
        {description}
      </p>

      <div className="mt-7">{children}</div>
    </>
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
      className={`rounded-[1.3rem] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
      style={{ "--tw-ring-color": accentColor }}
    >
      <div className="flex items-start justify-between gap-3">
        <Icon
          className="h-5 w-5"
          strokeWidth={2.2}
          style={{ color: accentColor }}
        />
        <TinySwitch value={value} accentColor={accentColor} />
      </div>

      <p className={`mt-5 text-sm font-black ${theme.text}`}>{title}</p>
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
      className={`flex min-h-[76px] items-center justify-between gap-4 rounded-[1.3rem] border px-4 text-left transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
      style={{ "--tw-ring-color": accentColor }}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon
            className="h-[18px] w-[18px]"
            strokeWidth={2.2}
            style={{ color: accentColor }}
          />
        </span>

        <span className="min-w-0">
          <span className={`block text-sm font-black ${theme.text}`}>
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

function TinySwitch({ value, accentColor }) {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition"
      style={{
        backgroundColor: value ? accentColor : "rgba(113, 113, 122, 0.26)",
      }}
    >
      <motion.span
        animate={{ x: value ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="h-5 w-5 rounded-full bg-white shadow-sm"
      />
    </span>
  );
}

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
      className={`w-full rounded-[1.3rem] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft} ${
        disabled ? "cursor-not-allowed opacity-60" : "hover:opacity-90"
      }`}
      style={{ "--tw-ring-color": accentColor }}
    >
      <span className="flex min-w-0 items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon
            className="h-[18px] w-[18px]"
            strokeWidth={2.2}
            style={{ color: accentColor }}
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-black ${theme.text}`}>
            {title}
          </span>

          <span
            className={`mt-1 block text-xs font-medium leading-relaxed ${theme.muted}`}
          >
            {description}
          </span>

          {actionLabel && (
            <span
              className="mt-3 inline-flex max-w-full rounded-full px-3 py-1 text-[10px] font-extrabold sm:hidden"
              style={{
                backgroundColor: `${accentColor}18`,
                color: accentColor,
              }}
            >
              {actionLabel}
            </span>
          )}
        </span>

        <span className="hidden shrink-0 items-center gap-2 sm:flex">
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
      </span>
    </button>
  );
}

function InfoRow({ label, value, theme }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 ${theme.elevated}`}
    >
      <span className={`text-xs font-bold ${theme.text}`}>{label}</span>
      <span className={`text-xs font-extrabold ${theme.muted}`}>{value}</span>
    </div>
  );
}

function CheckMark({ color }) {
  return (
    <span
      className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-black text-white"
      style={{ backgroundColor: color }}
    >
      ✓
    </span>
  );
}

function DangerButton({ icon: Icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`flex min-h-11 items-center justify-between rounded-2xl border border-rose-500/20 bg-transparent px-4 text-left text-sm font-bold text-current transition ${
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

function Field({ label, value, onChange, disabled = false, accentColor }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>

      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-2xl border border-zinc-300/70 bg-white/80 px-4 text-sm font-medium text-zinc-900 outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
        style={{ "--tw-ring-color": accentColor }}
      />
    </label>
  );
}

function ModalShell({ title, theme, onClose, prefersReducedMotion, children }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        initial={
          prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 20, scale: 0.98 }
        }
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className={`w-full max-w-md rounded-[2rem] border p-6 shadow-2xl sm:p-7 ${theme.modal}`}
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-sm font-semibold ${theme.muted}`}>
              Impostazioni
            </p>
            <h2
              id="settings-modal-title"
              className={`mt-1 text-2xl font-black tracking-[-0.05em] ${theme.text}`}
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

function StatusBadge({ children, active = true }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black ${
        active
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
          : "border-amber-500/20 bg-amber-500/10 text-amber-500"
      }`}
    >
      {children}
    </span>
  );
}

function SystemPanel({
  theme,
  accentColor,
  cloudEnabled,
}) {
  return (
    <PanelFrame
      eyebrow="Sistema"
      title="Stato dell'app"
      description="Informazioni sul servizio e sul salvataggio dei dati."
      theme={theme}
    >
      <div
        className="flex min-h-[88px] w-full items-center justify-between rounded-[1.5rem] border px-4"
        style={{
          borderColor: `${accentColor}33`,
          backgroundColor: `${accentColor}10`,
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            <Cloud
              className="h-5 w-5"
              strokeWidth={2.2}
              style={{ color: accentColor }}
            />
          </span>

          <div className="min-w-0">
            <p className={`text-sm font-black ${theme.text}`}>Cloud attivo</p>

            <span
  className={`relative inline-flex h-3 w-3 rounded-full ${
    cloudEnabled ? "bg-emerald-500" : "bg-amber-500"
  }`}
/>
          </div>
        </div>

        <span className="relative flex h-3 w-3 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
        </span>
      </div>

      <div className={`mt-4 rounded-[1.5rem] border p-4 ${theme.soft}`}>
        <p className={`text-sm font-black ${theme.text}`}>
          Salvataggio automatico
        </p>

        <p
          className={`mt-1 text-xs font-medium leading-relaxed ${theme.muted}`}
        >
          I dati vengono salvati automaticamente sul tuo account. Non è
          necessaria alcuna operazione manuale.
        </p>
      </div>

      <div className={`mt-4 rounded-[1.5rem] border p-4 ${theme.soft}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-sm font-black ${theme.text}`}>
              Controlli avanzati
            </p>

            <p className={`mt-1 text-xs font-medium ${theme.muted}`}>
              Diagnostica, esportazione tecnica e gestione sessioni.
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
    </PanelFrame>
  );
}
