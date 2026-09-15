import { useEffect, useState } from "react";
import { LogOut, Shield, Smartphone } from "lucide-react";

import {
  getMySessions,
  revokeOtherSessions,
  revokeSession,
} from "../../services/accountService";
import { parseUserAgent } from "../../utils/userAgent";
import IconTile from "../ui/IconTile";
import ModalShell from "./ModalShell";

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

export default function SessionsModal({
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
                className={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 ${theme.softSurface}`}
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
                  <p className={`truncate text-sm font-bold ${theme.primaryText}`}>
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