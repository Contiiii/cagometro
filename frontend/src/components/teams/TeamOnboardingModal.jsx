import { useId } from "react";
import {
  Check,
  Clipboard,
  Copy,
  Flame,
  Share2,
  Trophy,
  UserPlus,
} from "lucide-react";

import ModalShell from "./ModalShell";
import CloseButton from "./CloseButton";
import IconTile from "../ui/IconTile";
import Panel from "../ui/Panel";

import { useTeamUI } from "../../hooks/useTeamUI";
import useTeamInvite from "../../hooks/useTeamInvite";

const WEEKLY_GOAL = 140;

export default function TeamOnboardingModal({
  onClose,
  team,
}) {
  const { theme, isDark, prefersReducedMotion } = useTeamUI();

  const titleId = useId();

  const {
    inviteCode,
    inviteLink,
    copied,
    copyInvite,
    shareInvite,
  } = useTeamInvite(team);

  return (
    <ModalShell
      theme={theme}
      prefersReducedMotion={prefersReducedMotion}
      onClose={onClose}
      labelledBy={titleId}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-sm font-semibold ${theme.muted}`}>
              Squadra creata
            </p>

            <h2
              id={titleId}
              className={`mt-1 text-2xl font-black tracking-tight ${theme.primaryText}`}
            >
              La tua squadra è pronta
            </h2>

            <p
              className={`mt-2 max-w-[38ch] text-sm leading-relaxed ${theme.muted}`}
            >
              Tre cose da sapere per partire al meglio.
            </p>
          </div>

          <CloseButton
            onClick={onClose}
            theme={theme}
            isDark={isDark}
          />
        </div>

        <ol className="mt-7 grid gap-4">
          <li>
            <Panel
              theme={theme}
              radius="panel"
              padding="lg"
              className="relative overflow-hidden"
            >
              <div className="flex items-center gap-3">
              <IconTile
                size="md"
                className="bg-pink-500/15 text-pink-500"
              >
                <UserPlus className="h-5 w-5" strokeWidth={2.3} />
              </IconTile>

              <div className="min-w-0 flex-1">
                <p className={`text-sm font-black ${theme.primaryText}`}>
                  1 · Invita i tuoi amici
                </p>

                <p className={`mt-1 text-xs leading-relaxed ${theme.muted}`}>
                  Condividi il codice oppure copia il link per portare
                  nuovi membri in squadra.
                </p>
              </div>
            </div>

            <div
              className={`mt-5 flex items-center justify-between gap-4 rounded-2xl border p-4 ${
                isDark
                  ? "bg-white/[0.035]"
                  : "bg-zinc-900/[0.025]"
              }`}
            >
              <div className="min-w-0">
                <p
                  className={`text-[10px] font-bold uppercase tracking-[0.14em] ${theme.subtle}`}
                >
                  Codice squadra
                </p>

                <p
                  className={`mt-1.5 break-all font-mono text-xl font-black tracking-[0.12em] ${theme.primaryText}`}
                >
                  {inviteCode}
                </p>
              </div>

              <button
                type="button"
                onClick={copyInvite}
                disabled={!inviteLink}
                aria-label={
                  copied ? "Link invito copiato" : "Copia link invito"
                }
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

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={copyInvite}
                disabled={!inviteLink}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${theme.secondary} ${theme.focusOffset}`}
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
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-4 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(236,72,153,0.20)] transition hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Share2
                  className="h-4 w-4"
                  strokeWidth={2.3}
                />
                Condividi
              </button>
            </div>
            </Panel>
          </li>

          <li>
            <Panel
              theme={theme}
              radius="panel"
              padding="lg"
              className="flex items-start gap-3"
            >
              <IconTile
                size="md"
                className="bg-amber-400/15 text-amber-500"
              >
              <Flame className="h-5 w-5" strokeWidth={2.3} />
            </IconTile>

            <div className="min-w-0 flex-1">
              <p className={`text-sm font-black ${theme.primaryText}`}>
                2 · Obiettivo settimanale
              </p>

              <p className={`mt-1 text-xs leading-relaxed ${theme.muted}`}>
                Tutta la squadra punta a{" "}
                <span className={`font-bold ${theme.primaryText}`}>
                  {WEEKLY_GOAL.toLocaleString("it-IT")} registrazioni
                </span>{" "}
                in una settimana. La barra del traguardo resta sempre in
                cima alla pagina.
              </p>
            </div>
            </Panel>
          </li>

          <li>
            <Panel
              theme={theme}
              radius="panel"
              padding="lg"
              className="flex items-start gap-3"
            >
              <IconTile
                size="md"
                className="bg-emerald-400/15 text-emerald-600"
              >
              <Trophy className="h-5 w-5" strokeWidth={2.3} />
            </IconTile>

            <div className="min-w-0 flex-1">
              <p className={`text-sm font-black ${theme.primaryText}`}>
                3 · Classifica e attività
              </p>

              <p className={`mt-1 text-xs leading-relaxed ${theme.muted}`}>
                Ogni registrazione vale punti: la classifica mostra i
                progressi settimanali o totali, l'attività recente tiene
                il conto delle mosse della squadra.
              </p>
            </div>
            </Panel>
          </li>
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(236,72,153,0.24)] transition hover:bg-pink-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
        >
          Inizia a usare la squadra
        </button>
      </div>
    </ModalShell>
  );
}