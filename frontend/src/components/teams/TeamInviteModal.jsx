import { useState } from "react";
import {
  Check,
  Clipboard,
  Copy,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";

import ModalShell from "./ModalShell";
import CloseButton from "./CloseButton";

export default function TeamInviteModal({
  onClose,
  team,
  theme,
  isDark,
  prefersReducedMotion,
}) {
  const [copied, setCopied] = useState(false);

  const inviteCode = team?.invite_code ?? "";

  const inviteLink = inviteCode
    ? `${window.location.origin}/join/${inviteCode}`
    : "";

  async function copyInvite() {
    if (!inviteLink) {
      toast.error("Codice invito non disponibile");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch (error) {
      console.error(
        "Errore durante la copia dell'invito:",
        error,
      );

      toast.error("Non è stato possibile copiare il link");
    }
  }

  async function shareInvite() {
    if (!inviteLink) {
      toast.error("Codice invito non disponibile");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Unisciti a ${team?.team_name || "questa squadra"}`,
          text: `Entra nella squadra ${
            team?.team_name || ""
          } su Cagometro.`,
          url: inviteLink,
        });

        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error(
          "Errore durante la condivisione:",
          error,
        );
      }
    }

    await copyInvite();
  }

  return (
    <ModalShell
      theme={theme}
      prefersReducedMotion={prefersReducedMotion}
      onClose={onClose}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-sm font-semibold ${theme.muted}`}>
              {team?.team_name || "Squadra"}
            </p>

            <h2
              className={`mt-1 text-2xl font-black tracking-tight ${theme.primaryText}`}
            >
              Porta qualcuno nel team.
            </h2>
          </div>

          <CloseButton
            onClick={onClose}
            theme={theme}
            isDark={isDark}
          />
        </div>

        <div
          className={`mt-7 rounded-[1.5rem] border p-5 ${theme.softSurface}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.14em] ${theme.subtle}`}
              >
                Codice squadra
              </p>

              <p
                className={`mt-2 break-all font-mono text-2xl font-black tracking-[0.12em] ${theme.primaryText}`}
              >
                {inviteCode}
              </p>
            </div>

            <button
              type="button"
              onClick={copyInvite}
              disabled={!inviteLink}
              aria-label="Copia link invito"
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${theme.secondary} ${theme.focusOffset}`}
            >
              {copied ? (
                <Check
                  className="h-5 w-5 text-emerald-500"
                  strokeWidth={2.5}
                />
              ) : (
                <Copy
                  className="h-5 w-5"
                  strokeWidth={2.2}
                />
              )}
            </button>
          </div>

          <p
            className={`mt-4 text-xs font-medium leading-relaxed ${theme.muted}`}
          >
            Condividi il codice oppure copia il link completo per
            invitare nuovi membri.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={copyInvite}
            disabled={!inviteLink}
            className={`flex min-h-13 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${theme.secondary} ${theme.focusOffset}`}
          >
            {copied ? (
              <>
                <Check
                  className="h-4 w-4 text-emerald-500"
                  strokeWidth={2.5}
                />
                Link copiato
              </>
            ) : (
              <>
                <Clipboard
                  className="h-4 w-4"
                  strokeWidth={2.2}
                />
                Copia invito
              </>
            )}
          </button>

          <button
            type="button"
            onClick={shareInvite}
            disabled={!inviteLink}
            className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-4 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(236,72,153,0.20)] transition hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Share2
              className="h-4 w-4"
              strokeWidth={2.3}
            />
            Condividi
          </button>
        </div>
      </div>
    </ModalShell>
  );
}