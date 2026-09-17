import { useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Share, Smartphone, SquarePlus } from "lucide-react";

import useModalFocusTrap from "../hooks/useModalFocusTrap";
import { getTheme } from "../config/theme";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

export default function PushOptInModal({
  open,
  mode = "optin",
  isBusy = false,
  error = null,
  isDark = true,
  prefersReducedMotion = false,
  onAccept,
  onClose,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  const { canInstall, install } = useInstallPrompt();

  const theme = getTheme(isDark);

  useModalFocusTrap({ dialogRef, open, onClose, prefersReducedMotion });

  const isInstall = mode === "install";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-[110] flex items-end justify-center p-3 backdrop-blur-sm sm:items-center sm:p-6 ${theme.overlay}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose?.();
            }
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
              prefersReducedMotion ? false : { opacity: 0, y: 28, scale: 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }
            }
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
              duration: prefersReducedMotion ? 0 : undefined,
            }}
            className={`relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-x-hidden overflow-y-auto overscroll-contain rounded-[2rem] border shadow-2xl ${theme.modal}`}
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-accent/[0.12] blur-3xl" />

            <div className="relative p-6 sm:p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
                {isInstall ? (
                  <Smartphone className="h-6 w-6" strokeWidth={2.3} />
                ) : (
                  <BellRing className="h-6 w-6" strokeWidth={2.3} />
                )}
              </span>

              <h2
                id={titleId}
                className={`mt-4 text-2xl font-black tracking-[-0.05em] ${theme.primaryText}`}
              >
                {isInstall
                  ? "Aggiungi Cagometro alla Home"
                  : "Vuoi ricevere le notifiche?"}
              </h2>

              <p
                id={descriptionId}
                className={`mt-2 text-sm leading-relaxed ${theme.muted}`}
              >
                {isInstall
                  ? "Su iPhone e iPad le notifiche funzionano solo con l'app aggiunta alla schermata Home."
                  : "Ti avvisiamo per il promemoria giornaliero, la serie e le attività di squadra. Puoi disattivarle quando vuoi dalle impostazioni."}
              </p>

              {isInstall && (
                <ol className="mt-5 grid gap-3">
                  <li className={`flex items-center gap-3 rounded-2xl border p-3 ${theme.softSurface}`}>
                    <Share className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.2} />
                    <span className={`text-xs font-medium ${theme.muted}`}>
                      Tocca l'icona <span className={`font-bold ${theme.primaryText}`}>Condividi</span> in basso in Safari.
                    </span>
                  </li>

                  <li className={`flex items-center gap-3 rounded-2xl border p-3 ${theme.softSurface}`}>
                    <SquarePlus className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.2} />
                    <span className={`text-xs font-medium ${theme.muted}`}>
                      Scegli <span className={`font-bold ${theme.primaryText}`}>Aggiungi a schermata Home</span>.
                    </span>
                  </li>

                  <li className={`flex items-center gap-3 rounded-2xl border p-3 ${theme.softSurface}`}>
                    <BellRing className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.2} />
                    <span className={`text-xs font-medium ${theme.muted}`}>
                      Apri l'app dalla Home e attiva le notifiche.
                    </span>
                  </li>
                </ol>
              )}

              {error && (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-xs font-medium ${theme.muted}`}
                  style={{ borderColor: "currentColor", backgroundColor: "rgba(244,114,182,0.06)" }}
                >
                  {error}
                </div>
              )}

              <div className="mt-6 grid gap-3">
                {isInstall ? (
                  canInstall && (
                    <button
                      type="button"
                      onClick={() => install?.()}
                      className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_color-mix(in_oklab,var(--accent)_25%,transparent)] transition hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
                    >
                      <Smartphone className="h-5 w-5" strokeWidth={2.3} />
                      Installa app
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => onAccept?.()}
                    disabled={isBusy}
                    className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_color-mix(in_oklab,var(--accent)_25%,transparent)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
                  >
                    <BellRing className="h-5 w-5" strokeWidth={2.3} />
                    {isBusy ? "Attivazione…" : "Attiva notifiche"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onClose?.()}
                  disabled={isBusy}
                  className={`flex min-h-11 w-full items-center justify-center rounded-2xl px-5 text-sm font-bold transition enabled:hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${theme.muted}`}
                >
                  Non ora
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
