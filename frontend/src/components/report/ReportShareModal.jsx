import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share2, X } from "lucide-react";
import { toBlob } from "html-to-image";
import toast from "react-hot-toast";
import poopIcon from "../../assets/poop.webp?inline";
import useModalFocusTrap from "../../hooks/useModalFocusTrap";

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export default function ReportShareModal({
  open,
  onClose,
  report,
  period,
  total,
  todayTotal,
  bestPoint,
  theme,
  prefersReducedMotion,
  resolvedTheme,
}) {
  const cardRef = useRef(null);
  const dialogRef = useRef(null);
  const titleId = useId();
  const isWeekReport = period === "week";
  const isMonthReport = period === "month";

  const summaryTitle = isWeekReport
    ? "Riepilogo settimanale"
    : isMonthReport
      ? "Riepilogo mensile"
      : "Cagometro report";

  const bestPointLabel = isWeekReport
    ? "Miglior giorno della settimana"
    : isMonthReport
      ? "Miglior giorno del mese"
      : "Miglior giorno";

  const safeBestPoint = bestPoint ?? {
    date: "—",
    value: 0,
  };

  const totalLabel = isWeekReport
    ? "Registrazioni di oggi"
    : isMonthReport
      ? "Registrazioni del mese"
      : "Totale registrazioni";

  const isDarkCard = resolvedTheme === "dark";

  const exportCardClass = isDarkCard
    ? "border-white/[0.08] bg-[#18181b] text-zinc-50"
    : "border-zinc-900/[0.08] bg-[#fffaf8] text-zinc-950";

  const exportPanelClass = isDarkCard
    ? "border-white/[0.08] bg-white/[0.04]"
    : "border-zinc-900/[0.08] bg-zinc-900/[0.03]";

  const exportMutedClass = isDarkCard ? "text-zinc-400" : "text-zinc-600";
  const exportSubtleClass = "text-zinc-500";
  const exportStrongClass = isDarkCard ? "text-zinc-50" : "text-zinc-950";

  const exportBadgeClass = isDarkCard
    ? "bg-accent/16 text-accent"
    : "bg-accent/10 text-accent";

  const exportIconTileClass = isDarkCard
    ? "border-white/[0.08] bg-white/[0.06]"
    : "border-accent/15 bg-accent/10";

  const [isSharing, setIsSharing] = useState(false);

  useModalFocusTrap({
    dialogRef,
    open,
    onClose,
    prefersReducedMotion,
  });

async function handleShareCard() {
  if (isSharing) return;

  setIsSharing(true);

  try {
    if (!cardRef.current) {
      return;
    }

    const images = Array.from(
      cardRef.current.querySelectorAll("img"),
    );
    await Promise.all(
      images.map((img) => img.decode?.().catch(() => {})),
    );
    await document.fonts?.ready;

    const blob = await withTimeout(
      toBlob(cardRef.current, {
        pixelRatio: Math.min(window.devicePixelRatio || 2, 3) * 1.5,
        cacheBust: true,
        backgroundColor: isDarkCard ? "#18181b" : "#fffaf8",
      }),
      15000,
      "Timeout durante la generazione dell'immagine",
    );

    if (!blob) {
      throw new Error("Impossibile generare l'immagine");
    }

    const file = new File([blob], "cagometro-report.png", {
      type: "image/png",
    });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      toast.success("Immagine condivisa");
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cagometro-report.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Immagine salvata");

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    if (error?.name === "AbortError") return;

    console.error("Errore durante la condivisione della card:", error);
    toast.error("Errore durante la condivisione");
  } finally {
    setIsSharing(false);
  }
}

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
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
              prefersReducedMotion ? false : { opacity: 0, y: 22, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 18, scale: 0.985 }
            }
            transition={{
              type: "spring",
              stiffness: 360,
              damping: 30,
            }}
            className={`flex w-full max-w-md max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[2rem] border shadow-2xl sm:max-h-[calc(100vh-3rem)] ${theme.modal}`}
          >
            <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
              <div>
                <p className={`text-sm font-semibold ${theme.muted}`}>
                  Anteprima report
                </p>

                <h2
                  id={titleId}
                  className={`mt-1 text-[1.7rem] font-black tracking-[-0.04em] ${theme.primaryText}`}
                >
                  Condividi il ritmo
                </h2>

                <p
                  className={`mt-2 max-w-[30ch] text-sm leading-relaxed ${theme.muted}`}
                >
                  Condividi direttamente l'immagine della card.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Chiudi"
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition-colors ${theme.secondary}`}
              >
                <X className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6 overscroll-contain">
              <div
                ref={cardRef}
                className={`relative mt-1 overflow-hidden rounded-[1.8rem] border ${exportCardClass}`}
              >
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/[0.08] blur-3xl" />

                <div className="relative p-5 sm:p-6">
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[1.1rem] border shadow-[0_10px_24px_rgba(236,72,153,0.16)] ${exportIconTileClass}`}
                      >
                        <img
                          src={poopIcon}
                          alt="Report"
                          className="h-8 w-8 object-contain"
                        />
                      </div>

                      <p
                        className={`min-w-0 text-[11px] font-bold uppercase leading-tight tracking-[0.16em] ${exportSubtleClass}`}
                      >
                        {summaryTitle}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 whitespace-nowrap rounded-full border border-accent/20 px-3 py-1.5 text-[11px] font-extrabold ${exportBadgeClass}`}
                    >
                      {report.label}
                    </span>
                  </div>

                  <div className="relative mt-7">
                    <p className={`text-sm font-bold ${exportMutedClass}`}>
                      {totalLabel}
                    </p>

                    <p
                      className={`mt-1 text-[clamp(3rem,12vw,4rem)] font-black leading-none tracking-[-0.08em] ${exportStrongClass}`}
                    >
                      {isWeekReport ? (todayTotal ?? 0) : total}
                    </p>
                  </div>

                  <div
                    className={`mt-6 grid gap-3 ${isMonthReport ? "grid-cols-3" : "grid-cols-2"}`}
                  >
                    <div
                      className={`rounded-2xl border p-3.5 ${exportPanelClass}`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.14em] ${exportSubtleClass}`}
                      >
                        Streak attiva oggi
                      </p>

                      <p
                        className={`mt-1.5 text-2xl font-black ${exportStrongClass}`}
                      >
                        {report.streak} g
                      </p>
                    </div>

                    {isMonthReport && (
                      <div
                        className={`rounded-2xl border p-3.5 ${exportPanelClass}`}
                      >
                        <p
                          className={`text-[10px] font-bold uppercase tracking-[0.14em] ${exportSubtleClass}`}
                        >
                          Miglior streak del mese
                        </p>

                        <p
                          className={`mt-1.5 text-2xl font-black ${exportStrongClass}`}
                        >
                          {report.bestMonthStreak ?? 0} g
                        </p>
                      </div>
                    )}

                    <div
                      className={`rounded-2xl border p-3.5 ${exportPanelClass}`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.14em] ${exportSubtleClass}`}
                      >
                        Giorno migliore
                      </p>

                      <p
                        className={`mt-1.5 text-2xl font-black ${exportStrongClass}`}
                      >
                        {safeBestPoint.value}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-5 rounded-2xl border px-4 py-3 ${exportPanelClass}`}
                  >
                    <p
                      className={`text-xs leading-relaxed ${exportMutedClass}`}
                    >
                      {bestPointLabel}:{" "}
                      <span className={`font-extrabold ${exportStrongClass}`}>
                        {safeBestPoint.date}
                      </span>{" "}
                      con{" "}
                      <span className={`font-extrabold ${exportStrongClass}`}>
                        {safeBestPoint.value}
                      </span>{" "}
                      registrazioni.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-black/5 px-5 py-4 sm:px-6 sm:py-5">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <button
                  type="button"
                  onClick={handleShareCard}
                  disabled={isSharing}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_color-mix(in_oklab,var(--accent)_28%,transparent)] transition-all hover:bg-accent hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
                >
                  <Share2 className="h-5 w-5" strokeWidth={2.4} />
                  {isSharing ? "Condivisione…" : "Condividi immagine"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${theme.secondary}`}
                >
                  <X className="h-4 w-4" strokeWidth={2.2} />
                  Chiudi
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
