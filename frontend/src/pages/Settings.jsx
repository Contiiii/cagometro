import { useEffect, useId, useMemo, useRef, useState } from "react";
import useModalFocusTrap from "../hooks/useModalFocusTrap";
import {
  ArrowLeft,
  BellRing,
  ChevronRight,
  Cloud,
  Download,
  Gauge,
  Info,
  Lightbulb,
  LogIn,
  LogOut,
  Moon,
  Palette,
  Pencil,
  Save,
  Send,
  Shield,
  Smartphone,
  Sun,
  Trash2,
  TrendingUp,
  Trophy,
  User,
  UsersRound,
  Vibrate,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useProfile } from "../hooks/useProfile";
import { useAuth } from "../hooks/useAuth";

import { useEntries } from "../hooks/useEntries";

import { useTheme } from "../hooks/useTheme";

import { useSettings } from "../hooks/useSettings";

import IconTile from "../components/ui/IconTile";
import StatCard from "../components/ui/StatCard";
import ReleaseNotesModal from "../components/ReleaseNotesModal";

import { submitFeedback } from "../services/feedbackService";
import {
  deleteAccount,
  getMySessions,
  revokeOtherSessions,
  revokeSession,
} from "../services/accountService";
import { APP_VERSION, RELEASE_FEATURES } from "../config/releaseNotes";
import { accentOptions } from "../config/appearance";
import { resolveSyncState } from "../config/syncState";
import { getLevel } from "../config/levels";
import { getTotalHistorical } from "../utils/stats";
import { clearAllLocalData } from "../utils/storage";
import { parseUserAgent } from "../utils/userAgent";
import { buildTechExport } from "../utils/techExport";

const feedbackCategories = [
  { id: "miglioria", label: "Miglioria" },
  { id: "aggiornamento", label: "Aggiornamento" },
  { id: "bug", label: "Bug" },
  { id: "altro", label: "Altro" },
];

const settingsSections = [
  {
    id: "appearance",
    label: "Aspetto",
    description: "Tema, colore e movimento",
    icon: Palette,
    disabled: false,
  },
  {
    id: "notifications",
    label: "Notifiche",
    description: "Promemoria e avvisi",
    icon: BellRing,
    disabled: false,
  },
  {
    id: "system",
    label: "Dati e sincronizzazione",
    description: "Servizi e salvataggio dei dati",
    icon: Cloud,
    disabled: false,
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

  const profileName = profile?.displayName ?? profile?.display_name ?? "Utente";

  const profileAvatar = profile?.avatarUrl ?? profile?.avatar_url ?? null;

  const profileInitial = profileName.trim().slice(0, 1).toUpperCase() || "U";

  const { theme: themeMode, setTheme, resolvedTheme } = useTheme();

  const {
    accent,
    setAccent,
    vibrationEnabled,
    initialTeamActivityLimit,
    dailyReminder,
    streakAlerts,
    achievementAlerts,
    teamAlerts,
    updateSetting,
  } = useSettings();

  const { entries, syncStatus, pendingChanges, clearLocalData } = useEntries();

  const dayCount = useMemo(() => Object.keys(entries).length, [entries]);
  const totalCount = useMemo(
    () =>
      Object.values(entries).reduce(
        (acc, value) => acc + value,
        0,
      ),
    [entries],
  );

  const totalXp = useMemo(() => getTotalHistorical(entries) * 10, [entries]);
  const effectiveLevel = useMemo(() => getLevel(totalXp).level, [totalXp]);

  const [activeSection, setActiveSection] = useState(settingsSections[0].id);
  const cloudEnabled = Boolean(user);
  const canVibrate =
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function";

  const syncState = useMemo(
    () => resolveSyncState(user, syncStatus, pendingChanges),
    [user, syncStatus, pendingChanges],
  );

  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [dangerModal, setDangerModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState("altro");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false);
  const [typedAccountName, setTypedAccountName] = useState("");

  const openDangerAction = (action) => {
    setTypedAccountName("");
    setDangerModal(action);
  };

  const closeDangerAction = () => {
    setTypedAccountName("");
    setDangerModal(null);
  };

  const mobileTabsRef = useRef(null);
  const mobileTabButtonsRef = useRef({});

  const [draftProfile, setDraftProfile] = useState({
    name: "",
    email: "",
  });

  const resolvedDark = resolvedTheme === "dark";

  const accentColor = useMemo(
    () => accentOptions.find((item) => item.id === accent)?.color ?? "#ec4899",
    [accent],
  );

  const theme = useMemo(
    () =>
      resolvedDark
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
          },
    [resolvedDark],
  );

  useEffect(() => {
    const activeTab = mobileTabButtonsRef.current[activeSection];

    if (!activeTab) return;

    activeTab.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeSection]);

  const showToast = (message) => {
    setToast(message);

    window.setTimeout(() => {
      setToast(null);
    }, 2200);
  };

  const handleExportTech = () => {
    const payload = buildTechExport({
      app: "Cagometro",
      versione: APP_VERSION,
      generatoIl: new Date().toISOString(),
      utenteLoggato: Boolean(user),
      syncStatus,
      label: syncState.label,
      modificheInAttesa: pendingChanges,
      giorniRegistrati: dayCount,
      totaleSegnalazioni: totalCount,
      entries,
    });

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const clock = new Date();
    const stamp = [
      clock.getFullYear(),
      String(clock.getMonth() + 1).padStart(2, "0"),
      String(clock.getDate()).padStart(2, "0"),
      "-",
      String(clock.getHours()).padStart(2, "0"),
      String(clock.getMinutes()).padStart(2, "0"),
    ].join("");

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cagometro-export-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    showToast("Export tecnico scaricato");
  };

  const openProfileEditor = () => {
    setDraftProfile({
      name: profileName === "Utente" ? "" : profileName,
      email: user?.email ?? "",
    });

    setProfileEditorOpen(true);
  };

  const openFeedback = () => {
    setFeedbackCategory("altro");
    setFeedbackMessage("");
    setFeedbackName(profileName !== "Utente" ? profileName : "");
    setFeedbackOpen(true);
  };

  const openReleaseNotes = () => {
    setReleaseNotesOpen(true);
  };

  const openSystemTab = () => {
    setActiveSection("system");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeReleaseNotes = () => {
    window.localStorage.setItem(
      "cagometro_last_seen_version",
      APP_VERSION,
    );

    setReleaseNotesOpen(false);
  };

  async function sendFeedback() {
    const trimmedName = feedbackName.trim();
    const trimmedMessage = feedbackMessage.trim();

    if (!trimmedName) {
      showToast("Scrivi il tuo nome");
      return;
    }

    if (!trimmedMessage) {
      showToast("Scrivi prima un messaggio");
      return;
    }

    try {
      setFeedbackSending(true);

      await submitFeedback({
        category: feedbackCategory,
        message: trimmedMessage,
        name: trimmedName,
        userId: user?.id ?? null,
      });

      setFeedbackOpen(false);
      setFeedbackMessage("");
      showToast("Segnalazione inviata. Grazie!");
    } catch (error) {
      console.error("Errore durante l'invio della segnalazione:", error);
      showToast("Non è stato possibile inviare la segnalazione");
    } finally {
      setFeedbackSending(false);
    }
  }

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
    if (dangerModal === "delete-data") {
      setDangerModal(null);

      clearLocalData();
      clearAllLocalData(user?.id);
      showToast("Dati locali eliminati");

      return;
    }

    if (dangerModal === "delete-account") {
      setDangerModal(null);

      try {
        await deleteAccount();

        clearLocalData();
        clearAllLocalData(user?.id);

        try {
          await logout();
        } catch (error) {
          console.error("Sessione già revocata:", error);
        }

        navigate("/");
        showToast("Account eliminato");
      } catch (error) {
        console.error(
          "Errore durante l'eliminazione dell'account:",
          error,
        );
        showToast("Non è stato possibile eliminare l'account");
      }

      return;
    }

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

          <button
            type="button"
            onClick={openSystemTab}
            aria-label="Vai allo stato di sincronizzazione"
            className={`relative rounded-2xl border transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
            style={{ "--tw-ring-color": accentColor }}
          >
            <IconTile size="lg" role="status">
              <Cloud
                className="h-5 w-5"
                strokeWidth={2.2}
                style={{
                  color: syncState.iconColor ?? accentColor,
                }}
              />
            </IconTile>

            <span
              className={`absolute right-2 top-2 h-2 w-2 rounded-full ${
                syncState.dotClass
              }`}
            />
          </button>
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
              <IconTile
                size="3xl"
                className="relative overflow-hidden text-2xl font-black text-white shadow-[0_14px_30px_rgba(0,0,0,0.16)]"
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
              </IconTile>

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

          <div className="relative mt-6 grid grid-cols-2 gap-3">
            <StatCard label="Livello" value={effectiveLevel} theme={theme} />

            <StatCard
              label="Esperienza"
              value={`${totalXp.toLocaleString("it-IT")} XP`}
              theme={theme}
            />
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
                      <IconTile
                        size="sm"
                        className={
                          isActive && !isDisabled
                            ? resolvedDark
                              ? "bg-zinc-900/10"
                              : "bg-white/10"
                            : theme.soft
                        }
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
                      </IconTile>

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
                  setTheme={setTheme}
                  initialTeamActivityLimit={initialTeamActivityLimit}
                  setInitialTeamActivityLimit={(value) =>
                    updateSetting("initialTeamActivityLimit", value)
                  }
                />
              )}

              {activeSection === "notifications" && (
                <NotificationsPanel
                  theme={theme}
                  accentColor={accentColor}
                  dailyReminder={dailyReminder}
                  streakAlerts={streakAlerts}
                  achievementAlerts={achievementAlerts}
                  teamAlerts={teamAlerts}
                  updateSetting={updateSetting}
                />
              )}

              {activeSection === "system" && (
                <SystemPanel
                  theme={theme}
                  accentColor={accentColor}
                  syncState={syncState.label}
                  syncDotClass={syncState.dotClass}
                  syncPing={syncState.ping}
                  cloudEnabled={cloudEnabled}
                  dayCount={dayCount}
                  totalCount={totalCount}
                  pendingCount={pendingChanges.length}
                  vibrationEnabled={vibrationEnabled}
                  setVibrationEnabled={(value) =>
                    updateSetting("vibrationEnabled", value)
                  }
                  canVibrate={canVibrate}
                  onExportTech={handleExportTech}
                  onShowReleaseNotes={openReleaseNotes}
                />
              )}

              {activeSection === "account" && (
                <AccountPanel
                  theme={theme}
                  accentColor={accentColor}
                  themeMode={themeMode}
                  accent={accent}
                  isLoggedIn={Boolean(user)}
                  onDanger={openDangerAction}
                  onFeedback={openFeedback}
                  onPrivacy={() => navigate("/privacy")}
                  onDevices={() => setSessionsOpen(true)}
                  onShowReleaseNotes={openReleaseNotes}
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
                dark={resolvedDark}
              />

              <Field
                label="Email"
                value={draftProfile.email}
                onChange={(value) =>
                  setDraftProfile((current) => ({ ...current, email: value }))
                }
                accentColor={accentColor}
                disabled
                dark={resolvedDark}
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
            onClose={closeDangerAction}
            prefersReducedMotion={prefersReducedMotion}
          >
            <div className="rounded-[1.4rem] border border-rose-500/20 bg-rose-500/10 p-4 text-rose-500">
              <p className="text-sm font-black">
                {dangerModal === "logout" && "Vuoi davvero disconnetterti?"}
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

            {dangerModal === "delete-account" && (
              <div className="mt-5 grid gap-2">
                <label className="grid gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-[0.12em] ${
                      resolvedDark ? "text-zinc-400" : "text-zinc-500"
                    }`}
                  >
                    Digita {profileName} per confermare
                  </span>

                  <input
                    value={typedAccountName}
                    onChange={(event) =>
                      setTypedAccountName(event.target.value)
                    }
                    placeholder={profileName}
                    autoComplete="off"
                    className={`min-h-12 rounded-2xl border px-4 text-sm font-medium outline-none transition ${
                      resolvedDark
                        ? "border-white/10 bg-white/[0.06] text-zinc-100 placeholder:text-zinc-500"
                        : "border-zinc-300/70 bg-white/80 text-zinc-900"
                    }`}
                    style={{ "--tw-ring-color": accentColor }}
                  />
                </label>
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeDangerAction}
                className={`min-h-12 rounded-2xl border px-4 text-sm font-bold ${theme.soft}`}
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={handleDangerAction}
                disabled={
                  dangerModal === "delete-account" &&
                  typedAccountName.trim() !== profileName
                }
                className="min-h-12 rounded-2xl bg-rose-500 px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Conferma
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sessionsOpen && (
          <SessionsModal
            theme={theme}
            accentColor={accentColor}
            onClose={() => setSessionsOpen(false)}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}
      </AnimatePresence>

      <ReleaseNotesModal
        open={releaseNotesOpen}
        onClose={closeReleaseNotes}
        version={APP_VERSION}
        features={RELEASE_FEATURES}
        isDark={resolvedDark}
        prefersReducedMotion={prefersReducedMotion}
      />

      <AnimatePresence>
        {feedbackOpen && (
          <ModalShell
            title="Segnala un'idea"
            theme={theme}
            onClose={() => setFeedbackOpen(false)}
            prefersReducedMotion={prefersReducedMotion}
          >
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                {feedbackCategories.map((category) => {
                  const active = feedbackCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFeedbackCategory(category.id)}
                      className={`min-h-9 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition ${
                        active ? "border-transparent text-white" : theme.soft
                      }`}
                      style={
                        active
                          ? { backgroundColor: accentColor }
                          : { "--tw-ring-color": accentColor }
                      }
                    >
                      {category.label}
                    </button>
                  );
                })}
              </div>

              <label className="grid gap-2">
                <span
                  className={`text-xs font-bold uppercase tracking-[0.12em] ${
                    resolvedDark ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  Messaggio
                </span>

                <textarea
                  value={feedbackMessage}
                  onChange={(event) => setFeedbackMessage(event.target.value)}
                  placeholder="Miglioria, aggiornamento, bug… dimmi tutto."
                  rows={5}
                  className={`min-h-32 resize-y rounded-2xl border p-4 text-sm font-medium outline-none transition focus-visible:ring-2 ${
                    resolvedDark
                      ? "border-white/10 bg-white/[0.06] text-zinc-100 placeholder:text-zinc-500"
                      : "border-zinc-300/70 bg-white/80 text-zinc-900"
                  }`}
                  style={{ "--tw-ring-color": accentColor }}
                />
              </label>

              <Field
                label="Nome"
                value={feedbackName}
                onChange={setFeedbackName}
                accentColor={accentColor}
                dark={resolvedDark}
              />

              <button
                type="button"
                onClick={sendFeedback}
                disabled={feedbackSending}
                className="mt-1 flex min-h-14 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] disabled:opacity-60"
                style={{ backgroundColor: accentColor }}
              >
                <Send className="h-4 w-4" strokeWidth={2.3} />
                {feedbackSending ? "Invio…" : "Invia segnalazione"}
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

function AppearancePanel({
  theme,
  accent,
  setAccent,
  accentColor,
  themeMode,
  setTheme,
  initialTeamActivityLimit,
  setInitialTeamActivityLimit,
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
      <div className={`rounded-2xl border p-4 ${theme.soft}`}>
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
                onClick={() => setTheme(option.id)}
                aria-pressed={active}
                className={`min-h-[92px] rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
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
      </div>

      <div className={`mt-4 rounded-2xl border p-4 ${theme.soft}`}>
        <p
          className={`text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
        >
          Stile
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
      </div>

      <div className={`mt-4 rounded-2xl border p-4 ${theme.soft}`}>
        <p
          className={`text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
        >
          Attività del team
        </p>

        <p className={`mt-1 text-sm font-medium ${theme.muted}`}>
          Quante attività recenti mostrare all'inizio.
        </p>

        <div className="mt-3 grid grid-cols-3 divide-x divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {[3, 5, 10].map((option) => {
            const active = initialTeamActivityLimit === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setInitialTeamActivityLimit(option)}
                aria-pressed={active}
                className={`flex h-11 items-center justify-center text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 ${
                  active ? "text-white" : `${theme.soft} ${theme.muted}`
                }`}
                style={{
                  backgroundColor: active ? accentColor : undefined,
                  borderLeftColor: active ? accentColor : undefined,
                  borderRightColor: active ? accentColor : undefined,
                  "--tw-ring-color": accentColor,
                }}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </PanelFrame>
  );
}

function NotificationsPanel({
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
      <div className={`rounded-2xl border p-4 ${theme.soft}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-sm font-black ${theme.text}`}>
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

      <div className={`mt-4 overflow-hidden rounded-2xl border ${theme.soft}`}>
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

function AccountPanel({
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
    accentOptions.find((item) => item.id === accent)?.label ?? "Rosa classico";

  return (
    <PanelFrame
      eyebrow="Account"
      title="Le cose importanti"
      description="Segnalazioni, informazioni chiave e le azioni più delicate."
      theme={theme}
    >
      <div className={`overflow-hidden rounded-2xl border ${theme.soft}`}>
        <p
          className={`px-4 pb-3 pt-4 text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
        >
          Supporto e informazioni
        </p>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          <ActionRow
            icon={Lightbulb}
            title="Segnala un'idea"
            description="Migliorie, aggiornamenti o qualsiasi cosa vuoi farmi sapere."
            actionLabel="Scrivi"
            onClick={onFeedback}
            theme={theme}
            accentColor={accentColor}
          />

          <ActionRow
            icon={Info}
            title="Informativa privacy"
            description="Come vengono trattati i dati dell'account."
            onClick={onPrivacy}
            theme={theme}
            accentColor={accentColor}
          />
        </div>
      </div>

      <div className={`mt-4 overflow-hidden rounded-2xl border ${theme.soft}`}>
        <ActionRow
          icon={Shield}
          title="Verifica dispositivi"
          description="Controllo delle sessioni e dei dispositivi collegati."
          onClick={onDevices}
          theme={theme}
          accentColor={accentColor}
        />
      </div>

      <div className={`mt-4 overflow-hidden rounded-2xl border ${theme.soft}`}>
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

function InfoRow({ label, value, theme, action }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <span className={`text-sm font-bold ${theme.text}`}>{label}</span>

      {action ? (
        <span className="flex items-center gap-2.5">
          {value !== null && value !== undefined && (
            <span className={`text-sm font-extrabold ${theme.muted}`}>
              {value}
            </span>
          )}

          {action}
        </span>
      ) : (
        <span className={`text-sm font-extrabold ${theme.muted}`}>{value}</span>
      )}
    </div>
  );
}

function VersionInfoButton({ onClick, theme, accentColor }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Novità della versione"
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
      style={{ "--tw-ring-color": accentColor }}
    >
      <Info
        className="h-3.5 w-3.5"
        strokeWidth={2.4}
        style={{ color: accentColor }}
      />
    </button>
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

function Field({
  label,
  value,
  onChange,
  disabled = false,
  accentColor,
  dark = false,
}) {
  return (
    <label className="grid gap-2">
      <span
        className={`text-xs font-bold uppercase tracking-[0.12em] ${
          dark ? "text-zinc-400" : "text-zinc-500"
        }`}
      >
        {label}
      </span>

      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-12 rounded-2xl border px-4 text-sm font-medium outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
          dark
            ? "border-white/10 bg-white/[0.06] text-zinc-100 placeholder:text-zinc-500"
            : "border-zinc-300/70 bg-white/80 text-zinc-900"
        }`}
        style={{ "--tw-ring-color": accentColor }}
      />
    </label>
  );
}

function ModalShell({ title, theme, onClose, prefersReducedMotion, children }) {
  const dialogRef = useRef(null);

  useModalFocusTrap({ dialogRef, onClose, prefersReducedMotion });

  const titleId = useId();

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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={titleId}
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
        className={`max-h-[calc(100dvh-3rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[2rem] border p-6 shadow-2xl sm:p-7 ${theme.modal}`}
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-sm font-semibold ${theme.muted}`}>
              Impostazioni
            </p>
            <h2
              id={titleId}
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

function formatSessionTime(value) {
  if (!value) return "accesso sconosciuto";

  return new Date(value).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SessionsModal({
  theme,
  accentColor,
  onClose,
  prefersReducedMotion,
}) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busySessionId, setBusySessionId] = useState(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const data = await getMySessions();
        if (alive) setSessions(data);
      } catch (error) {
        console.error(
          "Errore durante il caricamento delle sessioni:",
          error,
        );
        if (alive) setLoadError(true);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  async function handleRevokeOne(sessionId) {
    setBusySessionId(sessionId);

    try {
      await revokeSession(sessionId);
      setSessions((current) =>
        current.filter((session) => session.session_id !== sessionId),
      );
    } catch (error) {
      console.error("Errore durante la revoca della sessione:", error);
    } finally {
      setBusySessionId(null);
    }
  }

  async function handleRevokeOthers() {
    setBusySessionId("all");

    try {
      await revokeOtherSessions();
      setSessions((current) =>
        current.filter((session) => session.is_current),
      );
    } catch (error) {
      console.error("Errore durante la revoca delle sessioni:", error);
    } finally {
      setBusySessionId(null);
    }
  }

  return (
    <ModalShell
      title="Dispositivi collegati"
      theme={theme}
      onClose={onClose}
      prefersReducedMotion={prefersReducedMotion}
    >
      {loading ? (
        <p className={`py-6 text-center text-sm font-semibold ${theme.muted}`}>
          Caricamento…
        </p>
      ) : loadError ? (
        <p className={`py-6 text-center text-sm font-semibold ${theme.muted}`}>
          Non è stato possibile caricare le sessioni. Riprova a riaprire la
          finestra.
        </p>
      ) : sessions.length === 0 ? (
        <p className={`py-6 text-center text-sm font-semibold ${theme.muted}`}>
          Nessuna sessione attiva
        </p>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => {
            const agent = parseUserAgent(session.user_agent);
            const deviceLabel =
              [agent.browser, agent.os].filter(Boolean).join(" · ") ||
              "Dispositivo sconosciuto";

            return (
              <div
                key={session.session_id}
                className={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 ${theme.soft}`}
              >
                <IconTile
                  size="md"
                  style={{ backgroundColor: `${accentColor}18` }}
                >
                  <Smartphone
                    className="h-5 w-5"
                    strokeWidth={2.2}
                    style={{ color: accentColor }}
                  />
                </IconTile>

                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-bold ${theme.text}`}>
                    {deviceLabel}
                  </p>

                  <p className={`mt-1 text-xs font-medium ${theme.muted}`}>
                    {[
                      session.ip ? `IP ${session.ip}` : null,
                      agent.device ? agent.device : null,
                      session.created_at
                        ? `Creato il ${formatSessionTime(session.created_at)}`
                        : null,
                      session.refreshed_at
                        ? `Ultimo accesso ${formatSessionTime(
                            session.refreshed_at,
                          )}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                {session.is_current ? (
                  <span
                    className="shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em]"
                    style={{
                      backgroundColor: `${accentColor}18`,
                      color: accentColor,
                    }}
                  >
                    Questa sessione
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRevokeOne(session.session_id)}
                    disabled={busySessionId !== null}
                    className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={2.2} />
                    Esci
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && sessions.some((session) => !session.is_current) && (
        <button
          type="button"
          onClick={handleRevokeOthers}
          disabled={busySessionId !== null}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 text-sm font-extrabold text-rose-500 disabled:opacity-50"
        >
          <Shield className="h-4 w-4" strokeWidth={2.3} />
          Revoca le altre sessioni
        </button>
      )}
    </ModalShell>
  );
}

function SystemPanel({
  theme,
  accentColor,
  cloudEnabled,
  syncState,
  syncDotClass,
  syncPing,
  dayCount,
  totalCount,
  pendingCount,
  vibrationEnabled,
  setVibrationEnabled,
  canVibrate,
  onExportTech,
  onShowReleaseNotes,
}) {
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
              <p className={`text-base font-black tracking-tight ${theme.text}`}>
                {cloudEnabled ? "Cloud attivo" : "Cloud non disponibile"}
              </p>

              <p
                className={`mt-1 text-xs font-medium leading-relaxed ${theme.muted}`}
              >
                {syncState}
              </p>
            </div>
          </div>

          <span
            className="inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em]"
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
      </div>

      {canVibrate && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setVibrationEnabled(!vibrationEnabled)}
            aria-pressed={vibrationEnabled}
            className={`flex min-h-[104px] w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 ${theme.soft}`}
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
                <span className={`block text-sm font-black ${theme.text}`}>
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

      <div className={`mt-4 rounded-2xl border p-4 ${theme.soft}`}>
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
            <p className={`text-sm font-black ${theme.text}`}>
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
        className={`mt-4 flex min-h-[104px] items-center justify-between gap-4 rounded-2xl border p-4 ${theme.soft}`}
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
