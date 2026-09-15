import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getTeamInvitePreview } from "../services/teamService";
import { useAuth } from "../hooks/useAuth";
import { useTeam } from "../hooks/useTeam";
import { useTeamActions } from "../hooks/useTeamActions";
import { notify } from "../utils/teamNotify";
import { getFriendlyErrorMessage } from "../utils/friendlyError";

export default function JoinTeamPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const {
    refreshDashboard,
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
    refreshActivity,
  } = useTeam();

  const { handleJoinTeam } = useTeamActions({
    notify,
    refreshDashboard,
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
    refreshActivity,
  });

  const [inviteTeam, setInviteTeam] = useState(null);
  const [previewStatus, setPreviewStatus] = useState("loading");
  const [joinStatus, setJoinStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const hasStartedJoinRef = useRef(false);

  const inviteCode = code?.trim().toUpperCase() ?? "";

  const isLoadingPreview = previewStatus === "loading";
  const isInvalidInvite = previewStatus === "error";
  const isJoining = joinStatus === "loading";

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/join/${inviteCode}`)}`, {
        replace: true,
      });

      return;
    }

    let cancelled = false;

    async function loadInvitePreview() {
      if (!inviteCode) {
        if (!cancelled) {
          setPreviewStatus("error");
          setErrorMessage("Il codice invito non è valido.");
        }

        return;
      }

      setPreviewStatus("loading");
      setErrorMessage("");

      try {
        const team = await getTeamInvitePreview(inviteCode);

        if (cancelled) {
          return;
        }

        if (!team) {
          setPreviewStatus("error");
          setErrorMessage(
            "Questo codice invito non è valido, è stato disattivato oppure è scaduto.",
          );

          return;
        }

        setInviteTeam(team);
        setPreviewStatus("ready");
      } catch (error) {
        console.error(
          "Errore caricamento anteprima invito:",
          error,
        );

        if (!cancelled) {
          setPreviewStatus("error");
          setErrorMessage(
            getFriendlyErrorMessage(
              error,
              "Non è stato possibile verificare il codice invito.",
            ),
          );
        }
      }
    }

    loadInvitePreview();

    return () => {
      cancelled = true;
    };
  }, [inviteCode, authLoading, user, navigate]);

  async function handleJoin() {
    if (authLoading) return;

    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/join/${inviteCode}`)}`, {
        replace: true,
      });

      return;
    }

    if (
      hasStartedJoinRef.current ||
      isJoining ||
      !inviteCode ||
      !inviteTeam
    ) {
      return;
    }

    hasStartedJoinRef.current = true;
    setJoinStatus("loading");
    setErrorMessage("");

    try {
      await handleJoinTeam(inviteCode, inviteTeam.name, { immediate: true });
    } catch (error) {
      console.error("Errore ingresso nella squadra:", error);

      setJoinStatus("error");
      setErrorMessage(
        getFriendlyErrorMessage(
          error,
          "Non è stato possibile entrare nella squadra.",
        ),
      );

      hasStartedJoinRef.current = false;
      return;
    }

    setJoinStatus("success");

    navigate("/teams", {
      replace: true,
    });
  }

  function handleCancel() {
    navigate("/teams", {
      replace: true,
    });
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0c0c0f] px-5 text-zinc-100">
      <section className="w-full max-w-sm rounded-[1.75rem] border border-white/[0.08] bg-zinc-900/80 p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          Invito squadra
        </p>

        <h1 className="mt-2 text-2xl font-black tracking-[-0.045em] text-zinc-50">
          Entra nella squadra
        </h1>

        {isLoadingPreview && (
          <p className="mt-4 text-sm text-zinc-400">
            Verifica invito in corso...
          </p>
        )}

        {isInvalidInvite && (
          <div
            className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {inviteTeam && previewStatus === "ready" && (
          <>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Hai ricevuto un invito a entrare in questa squadra.
            </p>

            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-xl">
                  {inviteTeam.avatar_emoji || "💩"}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-base font-black text-zinc-50">
                    {inviteTeam.name}
                  </p>

                  <p className="mt-1 text-xs font-medium text-zinc-400">
                    {Number(inviteTeam.member_count ?? 0).toLocaleString(
                      "it-IT",
                    )}{" "}
                    {Number(inviteTeam.member_count ?? 0) === 1
                      ? "membro"
                      : "membri"}
                  </p>
                </div>
              </div>

              {inviteTeam.description && (
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {inviteTeam.description}
                </p>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Codice invito
              </p>

              <p className="mt-1 break-all font-mono text-base font-black tracking-[0.08em] text-zinc-100">
                {inviteCode}
              </p>
            </div>
          </>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleJoin}
            disabled={
              isLoadingPreview ||
              isInvalidInvite ||
              isJoining ||
              !inviteTeam ||
              authLoading
            }
            className="min-h-12 rounded-2xl bg-accent px-4 text-sm font-extrabold text-white shadow-[0_10px_24px_color-mix(in_oklab,var(--accent)_25%,transparent)] transition-colors hover:bg-accent hover:brightness-110 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/35"
          >
            {isJoining
              ? "Accesso in corso..."
              : authLoading
                ? "Verifica..."
                : user
                  ? "Entra nella squadra"
                  : "Accedi per entrare"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isJoining}
            className="min-h-12 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 text-sm font-bold text-zinc-200 transition-colors hover:bg-white/[0.08] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Annulla
          </button>
        </div>
      </section>
    </main>
  );
}