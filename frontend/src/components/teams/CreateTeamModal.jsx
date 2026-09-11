import { useId, useMemo, useRef, useState } from "react";
import { Check, UsersRound, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import useModalFocusTrap from "../../hooks/useModalFocusTrap";

import { useTeamUI } from "../../hooks/useTeamUI";

export default function CreateTeamModal({
  open,
  onClose,
  onCreate,
}) {
  const { isDark } = useTeamUI();
  const prefersReducedMotion = useReducedMotion();

  const titleId = useId();
  const descriptionId = useId();

  const dialogRef = useRef(null);
  const nameInputRef = useRef(null);

  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [accent, setAccent] = useState("pink");
  const [submitting, setSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState(false);

  useModalFocusTrap({
    dialogRef,
    open,
    onClose: submitting ? undefined : onClose,
    initialFocusRef: nameInputRef,
    prefersReducedMotion,
  });

  const theme = isDark
    ? {
        panel: "border-white/[0.09] bg-[#17171b]",
        soft: "border-white/[0.08] bg-white/[0.035]",
        softer: "bg-white/[0.045]",
        text: "text-zinc-50",
        muted: "text-zinc-400",
        subtle: "text-zinc-400",
        overlay: "bg-zinc-950/65",
        input:
          "border-white/[0.10] bg-white/[0.04] text-zinc-50 placeholder:text-zinc-500",
      }
    : {
        panel: "border-zinc-900/[0.09] bg-[#fdfbf9]",
        soft: "border-zinc-900/[0.08] bg-zinc-900/[0.035]",
        softer: "bg-zinc-900/[0.045]",
        text: "text-zinc-950",
        muted: "text-zinc-600",
        subtle: "text-zinc-500",
        overlay: "bg-zinc-950/45",
        input:
          "border-zinc-900/[0.10] bg-white text-zinc-950 placeholder:text-zinc-400",
      };

  const accentOptions = useMemo(
    () => [
      { id: "pink", label: "Rosa", color: "bg-pink-500" },
      { id: "amber", label: "Ambra", color: "bg-amber-500" },
      { id: "emerald", label: "Verde", color: "bg-emerald-500" },
      { id: "violet", label: "Viola", color: "bg-violet-500" },
    ],
    [],
  );

  const accentClasses = {
    pink: "bg-pink-500 text-white shadow-[0_12px_30px_rgba(236,72,153,0.30)]",
    amber:
      "bg-amber-500 text-zinc-950 shadow-[0_12px_30px_rgba(245,158,11,0.28)]",
    emerald:
      "bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.28)]",
    violet:
      "bg-violet-500 text-white shadow-[0_12px_30px_rgba(139,92,246,0.28)]",
  };

  const canSubmit = teamName.trim().length >= 3 && !submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) return;

    try {
      setSubmitting(true);

      const payload = {
        name: teamName.trim(),
        description: description.trim(),

        // Il colore è temporaneamente solo visivo:
        // non viene inviato né salvato nel database.
        // accent,
      };

      await onCreate(payload);

      setJustCreated(true);

      window.setTimeout(() => {
        setSubmitting(false);
        setJustCreated(false);
        setTeamName("");
        setDescription("");
        setAccent("pink");
        onClose();
      }, 900);
    } catch {
      setSubmitting(false);
      setJustCreated(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;

    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6 ${theme.overlay}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleClose();
          }}
        >
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial={
              prefersReducedMotion ? false : { opacity: 0, y: 28, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 18, scale: 0.985 }
            }
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
              duration: prefersReducedMotion ? 0 : undefined,
            }}
            className={`relative max-h-[calc(100dvh-3rem)] w-full max-w-lg overflow-x-hidden overflow-y-auto overscroll-contain rounded-[2rem] border shadow-2xl ${theme.panel}`}
          >
            <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-pink-500/[0.10] blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-amber-400/[0.08] blur-3xl" />

            <div className="relative p-6 sm:p-7">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${theme.muted}`}>
                    Squadre
                  </p>
                  <h2
                    id={titleId}
                    className={`mt-1 text-3xl font-black tracking-[-0.06em] ${theme.text}`}
                  >
                    Crea squadra
                  </h2>
                  <p
                    id={descriptionId}
                    className={`mt-2 max-w-[36ch] text-sm leading-relaxed ${theme.muted}`}
                  >
                    Scegli un nome, una descrizione e il colore dell’anteprima.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleClose}
                  aria-label="Chiudi modale crea squadra"
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.soft}`}
                >
                  <X className="h-5 w-5" strokeWidth={2.2} />
                </button>
              </div>

              <div className={`mt-6 rounded-[1.5rem] border p-4 ${theme.soft}`}>
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-[1rem] ${accentClasses[accent]}`}
                  >
                    <UsersRound className="h-5 w-5" strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0">
                    <p className={`text-sm font-black ${theme.text}`}>
                      Anteprima squadra
                    </p>

                    <p
                      className={`truncate text-xs font-medium ${theme.muted}`}
                    >
                      {teamName.trim() || "Nome ancora in fase di apparizione"}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                <label className="grid gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
                  >
                    Nome squadra
                  </span>
                  <input
                    ref={nameInputRef}
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    placeholder="Es. Compost Crew"
                    minLength={3}
                    maxLength={40}
                    required
                    disabled={submitting}
                    className={`min-h-12 rounded-2xl border px-4 text-sm font-medium outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${theme.input}`}
                  />
                </label>

                <label className="grid gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
                  >
                    Descrizione
                  </span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Una riga che faccia capire il livello del progetto."
                    rows={3}
                    maxLength={150}
                    disabled={submitting}
                    className={`resize-none rounded-2xl border px-4 py-3 text-sm font-medium outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${theme.input}`}
                  />
                  <div className="flex justify-end">
                    <span className={`text-xs ${theme.subtle}`}>
                      {description.length}/150
                    </span>
                  </div>
                </label>

                <div className="grid gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
                  >
                    Colore della squadra
                  </span>

                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {accentOptions.map((option) => {
                      const active = accent === option.id;

                      return (
                        <button
                          key={option.id}
                          disabled={submitting}
                          type="button"
                          onClick={() => setAccent(option.id)}
                          aria-label={`Seleziona colore ${option.label}`}
                          aria-pressed={active}
                          className={`flex min-w-[92px] shrink-0 items-center gap-2 rounded-full border px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                            active
                              ? "border-pink-500 bg-pink-500/10"
                              : theme.soft
                          }`}
                        >
                          <span
                            className={`h-5 w-5 rounded-full ${option.color}`}
                          />
                          <span
                            className={`text-xs font-extrabold ${theme.text}`}
                          >
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-1 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={onClose}
                    className={`min-h-12 rounded-2xl border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.soft}`}
                  >
                    Annulla
                  </button>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`min-h-12 rounded-2xl px-4 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-40 ${accentClasses[accent]}`}
                  >
                    {submitting ? (
                      justCreated ? (
                        <span className="inline-flex items-center gap-2">
                          <Check className="h-4 w-4" strokeWidth={2.5} />
                          Creata
                        </span>
                      ) : (
                        "Creazione..."
                      )
                    ) : (
                      "Crea squadra"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
