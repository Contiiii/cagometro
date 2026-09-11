import { useId, useState } from "react";
import { UsersRound } from "lucide-react";
import toast from "react-hot-toast";

import ModalShell from "./ModalShell";
import CloseButton from "./CloseButton";

import { useTeamUI } from "../../hooks/useTeamUI";

export default function JoinTeamModal({
  onClose,
  onJoin,
}) {
  const { theme, isDark, prefersReducedMotion } = useTeamUI();

  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const titleId = useId();

  function handleClose() {
    if (!joining) {
      onClose();
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();

    if (!code) {
      toast.error("Inserisci un codice invito");
      return;
    }

    try {
      setJoining(true);

      await onJoin(code);

      setJoinCode("");
      onClose();
    } catch (error) {
      console.error(
        "Errore durante l'ingresso nella squadra:",
        error,
      );

      toast.error(
        error?.message ||
          "Non è stato possibile entrare nella squadra",
      );
    } finally {
      setJoining(false);
    }
  }

  return (
    <ModalShell
      theme={theme}
      prefersReducedMotion={prefersReducedMotion}
      onClose={handleClose}
      labelledBy={titleId}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-sm font-semibold ${theme.muted}`}>
              Entra in squadra
            </p>

            <h2
              id={titleId}
              className={`mt-1 text-2xl font-black tracking-tight ${theme.primaryText}`}
            >
              Hai un codice?
            </h2>
          </div>

          <CloseButton
            onClick={handleClose}
            disabled={joining}
            theme={theme}
            isDark={isDark}
          />
        </div>

        <label
          htmlFor="team-code"
          className={`mt-7 block text-sm font-bold ${theme.primaryText}`}
        >
          Codice squadra
        </label>

        <input
          id="team-code"
          value={joinCode}
          onChange={(event) =>
            setJoinCode(event.target.value.toUpperCase())
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleJoin();
            }
          }}
          placeholder="ES. CAGO-7F9K"
          maxLength={20}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={joining}
          className={`mt-2 min-h-14 w-full rounded-2xl border px-4 font-mono text-base font-bold tracking-[0.12em] outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${theme.input}`}
        />

        <button
          type="button"
          onClick={handleJoin}
          disabled={joining || !joinCode.trim()}
          className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(236,72,153,0.22)] transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
        >
          <UsersRound className="h-5 w-5" strokeWidth={2.3} />
          {joining ? "Ingresso..." : "Entra nella squadra"}
        </button>
      </div>
    </ModalShell>
  );
}