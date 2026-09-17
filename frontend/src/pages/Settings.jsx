import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BellRing,
  Cloud,
  LogIn,
  Palette,
  Pencil,
  Save,
  Send,
  User,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useProfile } from "../hooks/useProfile";
import { useAuth } from "../hooks/useAuth";

import { useEntries } from "../hooks/useEntries";

import { useTheme } from "../hooks/useTheme";
import { getTheme } from "../config/theme";

import { useSettings } from "../hooks/useSettings";

import IconTile from "../components/ui/IconTile";
import StatCard from "../components/ui/StatCard";
import ReleaseNotesModal from "../components/ReleaseNotesModal";
import SkeletonBlock from "../components/ui/SkeletonBlock";

import AppearancePanel from "../components/settings/AppearancePanel";
import NotificationsPanel from "../components/settings/NotificationsPanel";
import AccountPanel from "../components/settings/AccountPanel";
import SystemPanel from "../components/settings/SystemPanel";
import ModalShell from "../components/settings/ModalShell";
import SessionsModal from "../components/settings/SessionsModal";

import { submitFeedback } from "../services/feedbackService";
import {
  canSubmitFeedback,
  recordFeedbackSubmission,
} from "../utils/rateLimit";
import { deleteAccount } from "../services/accountService";
import { APP_VERSION, RELEASE_NOTES } from "../config/releaseNotes";
import { accentOptions } from "../config/appearance";
import { resolveSyncState } from "../config/syncState";
import { reportError } from "../utils/reportError";
import { getLevel } from "../config/levels";
import { getTotalHistorical } from "../utils/stats";
import { clearAllLocalData } from "../utils/storage";
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
    teamEntryAlerts,
    teamMemberAlerts,
    teamAchievementAlerts,
    updateSetting,
    loading: settingsLoading,
  } = useSettings();

  const { entries, syncStatus, pendingOps, clearLocalData, retrySync } =
    useEntries();

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
    () => resolveSyncState(user, syncStatus, pendingOps),
    [user, syncStatus, pendingOps],
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

  const theme = useMemo(() => getTheme(resolvedDark), [resolvedDark]);

  useEffect(() => {
    const activeTab = mobileTabButtonsRef.current[activeSection];

    if (!activeTab?.scrollIntoView) return;

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
      modificheInAttesa: pendingOps,
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

    const rateLimit = canSubmitFeedback();

    if (!rateLimit.ok) {
      if (rateLimit.waitMs > 0) {
        const seconds = Math.ceil(rateLimit.waitMs / 1000);
        showToast(`Attendi ancora ${seconds} secondi`);
      } else {
        showToast("Hai raggiunto il limite di segnalazioni oggi");
      }
      return;
    }

    try {
      setFeedbackSending(true);

      await submitFeedback({
        category: feedbackCategory,
        message: trimmedMessage,
        name: trimmedName,
      });

      recordFeedbackSubmission();

      setFeedbackOpen(false);
      setFeedbackMessage("");
      showToast("Segnalazione inviata. Grazie!");
    } catch (error) {
      reportError(error, {
        feature: "settings-feedback",
        userId: user?.id ?? null,
        message: "Errore durante l'invio della segnalazione:",
      });
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
      reportError(error, {
        feature: "settings-profile-save",
        userId: user?.id ?? null,
        message: "Errore durante il salvataggio del profilo:",
      });
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
          reportError(error, {
            feature: "settings-logout-after-delete",
            userId: user?.id ?? null,
            message: "Errore durante il logout:",
          });
        }

        navigate("/");
        showToast("Account eliminato");
      } catch (error) {
        reportError(error, {
          feature: "settings-account-delete",
          userId: user?.id ?? null,
          message: "Errore durante l'eliminazione dell'account:",
        });
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
      reportError(error, {
        feature: "settings-logout",
        userId: user?.id ?? null,
        message: "Errore durante il logout:",
      });
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
            className={`flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 ${theme.softSurface}`}
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
            <p className={`text-sm font-black tracking-tight ${theme.primaryText}`}>
              Impostazioni
            </p>
          </div>

          <button
            type="button"
            onClick={openSystemTab}
            aria-label="Vai allo stato di sincronizzazione"
            className={`relative rounded-2xl border transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 ${theme.softSurface}`}
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
                  className={`mt-1 truncate text-[clamp(1.65rem,4vw,2.2rem)] font-black tracking-[-0.06em] ${theme.primaryText}`}
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
                className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 sm:w-auto ${theme.softSurface}`}
                style={{ "--tw-ring-color": accentColor }}
              >
                <Pencil className="h-4 w-4" strokeWidth={2.3} />
                Modifica profilo
              </button>

              {!user && (
                <button
                  type="button"
                  onClick={login}
                  className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 sm:w-auto ${theme.softSurface}`}
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
                            : theme.softSurface
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
              {settingsLoading ? (
                <SkeletonBlock className="h-80 w-full" />
              ) : (
                <>
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
                  teamEntryAlerts={teamEntryAlerts}
                  teamMemberAlerts={teamMemberAlerts}
                  teamAchievementAlerts={teamAchievementAlerts}
                  updateSetting={updateSetting}
                />
              )}

              {activeSection === "system" && (
                <SystemPanel
                  theme={theme}
                  accentColor={accentColor}
                  syncState={syncState.label}
                  syncTone={syncState.tone}
                  syncDotClass={syncState.dotClass}
                  syncPing={syncState.ping}
                  cloudEnabled={cloudEnabled}
                  dayCount={dayCount}
                  totalCount={totalCount}
                  pendingCount={pendingOps.length}
                  onRetrySync={retrySync}
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
                </>
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
                    className={`min-h-12 rounded-2xl border px-4 text-base font-medium outline-none transition ${
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
                className={`min-h-12 rounded-2xl border px-4 text-sm font-bold ${theme.softSurface}`}
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
        notes={RELEASE_NOTES}
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
                        active ? "border-transparent text-white" : theme.softSurface
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
                  className={`min-h-32 resize-y rounded-2xl border p-4 text-base font-medium outline-none transition focus-visible:ring-2 ${
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
        className={`min-h-12 rounded-2xl border px-4 text-base font-medium outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
          dark
            ? "border-white/10 bg-white/[0.06] text-zinc-100 placeholder:text-zinc-500"
            : "border-zinc-300/70 bg-white/80 text-zinc-900"
        }`}
        style={{ "--tw-ring-color": accentColor }}
      />
    </label>
  );
}

