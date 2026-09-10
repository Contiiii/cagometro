import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share2, X } from "lucide-react";
import { toBlob } from "html-to-image";
import poopIcon from "../../assets/poop.png";

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
  const todayRegistrations = todayTotal ?? 0;
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

  const totalLabel = isWeekReport
    ? "Registrazioni di oggi"
    : isMonthReport
      ? "Registrazioni del mese"
      : "Totale registrazioni";

  const shareText = isWeekReport
    ? `Report settimanale · ${todayRegistrations} registrazioni oggi · miglior giorno: ${bestPoint?.date ?? "—"} (${bestPoint?.value ?? 0})`
    : isMonthReport
      ? `Report mensile · ${total} registrazioni · streak attuale: ${report.streak} giorni · miglior streak del mese: ${report.bestMonthStreak ?? 0} g · miglior giorno: ${bestPoint?.date ?? "—"} (${bestPoint?.value ?? 0})`
      : `Report ${report.label} · ${total} registrazioni`;

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
    ? "bg-pink-500/16 text-pink-300"
    : "bg-pink-500/10 text-pink-600";

  const exportIconTileClass = isDarkCard
    ? "border-white/[0.08] bg-white/[0.06]"
    : "border-pink-500/15 bg-pink-500/10";

  const [isSharing, setIsSharing] = useState(false);

  async function handleShareCard() {
    if (isSharing) return;

    setIsSharing(true);

    try {
      if (!cardRef.current) return;

      const blob = await withTimeout(
        toBlob(cardRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          skipFonts: true,
          backgroundColor: isDarkCard ? "#18181b" : "#fffaf8",
        }),
        20000,
        "Timeout durante la generazione dell'immagine",
      );

      if (!blob) {
        throw new Error("Impossibile generare l'immagine");
      }

      const file = new File([blob], "cagometro-report.png", {
        type: "image/png",
        lastModified: Date.now(),
      });

      const shareData = {
        title: "Cagometro Report",
        text: shareText,
        files: [file],
      };

      if (
        window.isSecureContext &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await withTimeout(
          navigator.share(shareData),
          60000,
          "Timeout durante la condivisione",
        );
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cagometro-report.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      alert(
        "La condivisione nativa non è disponibile qui: ho scaricato l'immagine.",
      );
    } catch (error) {
      if (error?.name === "AbortError") return;

      console.error("Errore durante la condivisione della card:", error);

      try {
        if (!cardRef.current) return;

        const blob = await withTimeout(
          toBlob(cardRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            skipFonts: true,
            backgroundColor: isDarkCard ? "#18181b" : "#fffaf8",
          }),
          20000,
          "Timeout durante la generazione dell'immagine",
        );

        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "cagometro-report.png";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        alert("Condivisione non riuscita: immagine scaricata.");
      } catch (fallbackError) {
        console.error("Errore anche nel fallback download:", fallbackError);
        alert("Non sono riuscito né a condividere né a scaricare l'immagine.");
      }
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-report-title"
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
            className={`flex w-full max-w-md max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[2rem] border shadow-2xl sm:max-h-[calc(100vh-3rem)] ${theme.sheet}`}
          >
            <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
              <div>
                <p className={`text-sm font-semibold ${theme.muted}`}>
                  Anteprima report
                </p>

                <h2
                  id="share-report-title"
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
                className={`mt-1 overflow-hidden rounded-[1.8rem] border ${exportCardClass}`}
              >
                <div className="relative p-5">
                  <div
                    className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-3xl ${
                      isDarkCard ? "bg-pink-500/14" : "bg-pink-500/10"
                    }`}
                  />
                  <div
                    className={`pointer-events-none absolute bottom-0 left-0 h-20 w-20 rounded-full blur-3xl ${
                      isDarkCard ? "bg-amber-400/12" : "bg-amber-400/10"
                    }`}
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <div
                        className={`grid h-12 w-12 place-items-center overflow-hidden rounded-[1.1rem] border shadow-[0_10px_24px_rgba(236,72,153,0.16)] ${exportIconTileClass}`}
                      >
                        <img
                          src={poopIcon}
                          alt="Report"
                          className="h-8 w-8 object-contain"
                        />
                      </div>

                      <p
                        className={`mt-3 text-[11px] font-bold uppercase tracking-[0.16em] ${exportSubtleClass}`}
                      >
                        {summaryTitle}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${exportBadgeClass}`}
                    >
                      {report.label}
                    </span>
                  </div>
                  <div className="relative mt-6">
                    <p className={`text-sm font-bold ${exportMutedClass}`}>
                      {totalLabel}
                    </p>

                    <p
                      className={`mt-1 text-5xl font-black leading-none tracking-[-0.08em] ${exportStrongClass}`}
                    >
                      {isWeekReport ? todayRegistrations : total}
                    </p>
                  </div>

                  <div className={`mt-5 grid gap-3 ${isMonthReport ? "grid-cols-3" : "grid-cols-2"}`}>
                    <div
                      className={`rounded-2xl border p-3 ${exportPanelClass}`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.14em] ${exportSubtleClass}`}
                      >
                        Streak attiva oggi
                      </p>

                      <p
                        className={`mt-1 text-2xl font-black ${exportStrongClass}`}
                      >
                        {todayRegistrations > 0 ? report.streak : 0} g
                      </p>
                    </div>

                    {isMonthReport && (
                      <div
                        className={`rounded-2xl border p-3 ${exportPanelClass}`}
                      >
                        <p
                          className={`text-[10px] font-bold uppercase tracking-[0.14em] ${exportSubtleClass}`}
                        >
                          Miglior streak del mese
                        </p>

                        <p
                          className={`mt-1 text-2xl font-black ${exportStrongClass}`}
                        >
                          {report.bestMonthStreak ?? 0} g
                        </p>
                      </div>
                    )}

                    <div
                      className={`rounded-2xl border p-3 ${exportPanelClass}`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.14em] ${exportSubtleClass}`}
                      >
                        Giorno migliore
                      </p>

                      <p
                        className={`mt-1 text-2xl font-black ${exportStrongClass}`}
                      >
                        {bestPoint?.value ?? 0}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-5 rounded-2xl border px-4 py-3 ${exportPanelClass}`}
                  >
                    <p className={`text-xs leading-relaxed ${exportMutedClass}`}>
                      {bestPointLabel}:{" "}
                      <span className={`font-extrabold ${exportStrongClass}`}>
                        {bestPoint?.date ?? "—"}
                      </span>{" "}
                      con{" "}
                      <span className={`font-extrabold ${exportStrongClass}`}>
                        {bestPoint?.value ?? 0}
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
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(236,72,153,0.28)] transition-all hover:bg-pink-400 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
                >
                  <Share2 className="h-5 w-5" strokeWidth={2.4} />
                  {isSharing ? "Condivisione…" : "Condividi immagine"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${theme.secondary}`}
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
