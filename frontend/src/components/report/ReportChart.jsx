import { motion } from "framer-motion";

import Card from "../ui/Card";

export default function ReportChart({
  report,
  selectedPoint,
  setSelectedPointId,
  setDetailsOpen,
  maxValue,
  prefersReducedMotion,
  isDark,
  theme,
}) {
  return (
    <Card
      as="section"
      theme={theme}
      radius="chart"
      padding="none"
      className="mx-auto mt-5 max-w-3xl"
    >
      <div className="flex items-end justify-between gap-4 px-5 pb-3 pt-5 sm:px-7 sm:pt-7">
        <div>
          <p className={`text-sm font-semibold ${theme.muted}`}>
            Andamento delle registrazioni
          </p>

          <h2
            className={`mt-1 text-2xl font-black tracking-[-0.055em] ${theme.text}`}
          >
            Il tuo ritmo nel tempo
          </h2>
        </div>

        <p
          className={`pb-1 text-right text-[11px] font-semibold ${theme.subtle}`}
        >
          Tocca una barra
        </p>
      </div>

      <div className="px-4 pb-5 pt-5 sm:px-7">
        <div
          role="list"
          aria-label={`Grafico registrazioni di ${report.label}`}
          className={`flex h-[225px] items-end ${
            report.label.includes("20") ||
            report.points.length > 15
              ? "gap-1"
              : "gap-2 sm:gap-3"
          }`}
        >
          {report.points.map((point, index) => {
            const isSelected =
              point.id === selectedPoint.id;

            const height = Math.max(
              7,
              (point.value / maxValue) * 100,
            );

            const showLabel =
              report.points.length <= 12 ||
              index === 0 ||
              index === 7 ||
              index === 14 ||
              index === 21 ||
              index === report.points.length - 1;

            return (
              <button
                key={point.id}
                type="button"
                role="listitem"
                aria-label={`${point.date}: ${point.value} registrazioni`}
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedPointId(point.id);
                  setDetailsOpen(true);
                }}
                className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
              >
                <span
                  className={`text-xs font-black ${
                    isSelected
                      ? "text-pink-500"
                      : "opacity-0"
                  }`}
                >
                  {point.value}
                </span>

                <div
                  className={`flex h-[156px] w-full items-end overflow-hidden rounded-full ${
                    isDark
                      ? "bg-white/[0.045]"
                      : "bg-zinc-900/[0.045]"
                  }`}
                >
                  <motion.span
                    initial={
                      prefersReducedMotion
                        ? false
                        : { height: 0 }
                    }
                    animate={{
                      height: `${height}%`,
                    }}
                    transition={{
                      duration:
                        prefersReducedMotion ? 0 : 0.42,
                      delay:
                        prefersReducedMotion
                          ? 0
                          : index * 0.025,
                      ease: "easeOut",
                    }}
                    className={`w-full rounded-full transition-colors ${
                      isSelected
                        ? "bg-pink-500"
                        : "bg-pink-500/45 group-hover:bg-pink-500/70"
                    }`}
                  />
                </div>

                <span
                  className={`h-3 text-[10px] font-bold ${
                    isSelected
                      ? "text-pink-500"
                      : theme.subtle
                  }`}
                >
                  {showLabel ? point.label : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}