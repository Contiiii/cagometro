import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useState } from "react";
import { motion } from "framer-motion";
import { getLocalDateKey } from "../utils/date";
import { useEntries } from "../hooks/useEntries";

import {
  getLastNDaysTotal,
  getRecordHistorical,
  getTotalHistorical,
  getMonthTotal,
  getWeeklyChartData,
  getMonthChartData,
} from "../utils/stats";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function Report() {
  const { entries } = useEntries();
  const today = getLocalDateKey();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const currentMonth = new Date();

  const isCurrentMonth =
    selectedMonth.getMonth() === currentMonth.getMonth() &&
    selectedMonth.getFullYear() === currentMonth.getFullYear();

  const daysInMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    0,
  ).getDate();

  const elapsedDays = isCurrentMonth ? currentMonth.getDate() : daysInMonth;

  const monthTotal = getMonthTotal(entries, selectedMonth);

  const monthAverage = (monthTotal / elapsedDays).toFixed(1);

  const monthLabel = selectedMonth.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  const todayCount = entries[today] || 0;

  const totalHistorical = getTotalHistorical(entries);
  const weeklyTotal = getLastNDaysTotal(entries, 7);
  const yearlyTotal = getLastNDaysTotal(entries, 365);
  const hasEntries = totalHistorical > 0;
  const recordHistorical = getRecordHistorical(entries);

  {
    /*dati per grafici */
  }

  const weeklyChartData = getWeeklyChartData(entries);

  const monthlyChartData = getMonthChartData(entries, selectedMonth);

  return (
    <div
      className="
      min-h-screen
      bg-black
      text-white
      flex
      flex-col
      pb-28
    "
    >
      <Header />

      <main
        className="

flex-1

w-full

max-w-3xl

mx-auto

px-4

sm:px-6

py-6

flex

flex-col

gap-5

"
      >
        {!hasEntries ? (
          <>
            <div>
              <h1 className="text-3xl font-black text-pink-400">📊 Report</h1>

              <p className="mt-1 text-sm text-zinc-500">
                Il WC dimentica, CAGOMETRO no.
              </p>
            </div>
            <div
              className="

rounded-3xl

border

border-zinc-800

bg-zinc-900/50

p-8

text-center

"
            >
              <div className="text-6xl">📊</div>

              <h2 className="mt-4 text-xl font-bold">
                Nessun dato disponibile
              </h2>

              <p className="mt-2 text-zinc-400">
                Registra qualche missione per visualizzare statistiche, grafici
                e record.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* TITOLO */}
            <div>
              <h1 className="text-3xl font-black text-pink-400">📊 Report</h1>

              <p className="mt-1 text-sm text-zinc-500">
                Il WC dimentica, CAGOMETRO no.
              </p>
            </div>

            {/* TOTALE STORICO PRINCIPALE */}
            <div
              className="
          relative
          overflow-hidden
          rounded-[2rem]
          border
          border-pink-500/20
          bg-gradient-to-br
          from-pink-500/15
          via-zinc-900/70
          to-zinc-950
          px-6
          py-7
          shadow-xl
          shadow-pink-500/10
          transition-all
          duration-300
          hover:border-pink-500/40
          hover:-translate-y-1
        "
            >
              <div
                className="
            absolute
            -right-8
            -top-8
            h-32
            w-32
            rounded-full
            bg-pink-500/10
            blur-3xl
          "
              />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-400">
                    Totale storico
                  </p>

                  <span className="text-3xl">💩</span>
                </div>

                <p
                  className="
              mt-2
              text-6xl
              font-black
              tracking-tight
              text-pink-400
              drop-shadow-[0_0_20px_rgba(244,114,182,0.25)]
            "
                >
                  {totalHistorical}
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  registrazioni complessive
                </p>
              </div>
            </div>

            {/* OGGI E ULTIMI 7 GIORNI */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div
                className="
            rounded-3xl
            border
            border-pink-500/10
            bg-zinc-900/60
            p-5
            transition-all
            duration-300
            hover:-translate-y-1
            hover:border-pink-500/30
          "
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-400">Oggi</p>

                  <span className="text-xl">📅</span>
                </div>

                <p className="mt-3 text-4xl font-black text-pink-400">
                  {todayCount}
                </p>

                <p className="mt-1 text-xs text-zinc-500">registrazioni</p>
              </div>

              <div
                className="
            rounded-3xl
            border
            border-pink-500/10
            bg-zinc-900/60
            p-5
            transition-all
            duration-300
            hover:-translate-y-1
            hover:border-pink-500/30
          "
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-400">Ultimi 7 giorni</p>

                  <span className="text-xl">🗓️</span>
                </div>

                <p className="mt-3 text-4xl font-black text-pink-400">
                  {weeklyTotal}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Media: {((weeklyTotal) / 7).toFixed(1)}
                </p>
              </div>
            </div>
            <div
              className="
    rounded-3xl
    border
    border-pink-500/10
    bg-zinc-900/60
    p-5
  "
            >
              <p className="mb-4 text-sm text-zinc-400">📅 Ultimi 7 giorni</p>

              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={weeklyChartData}>
                    <XAxis dataKey="day" />
                    <YAxis />

                    <Tooltip />

                    <Bar dataKey="count" fill="#f472b6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* MESE SELEZIONABILE */}
            <div
              className="
          rounded-[2rem]
          border
          border-pink-500/20
          bg-zinc-900/70
          p-5
          shadow-lg
          shadow-pink-500/5
          transition-all
          duration-300
          hover:border-pink-500/40
        "
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Vai al mese precedente"
                  onClick={() =>
                    setSelectedMonth(
                      new Date(
                        selectedMonth.getFullYear(),
                        selectedMonth.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                  className="
              flex
              h-10
              w-10
              cursor-pointer
              items-center
              justify-center
              rounded-full
              border
              border-zinc-700/60
              bg-zinc-800/60
              text-lg
              text-pink-400
              transition-all
              duration-200
              hover:scale-105
              hover:border-pink-500/30
              hover:bg-pink-500/10
              active:scale-95
            "
                >
                  ‹
                </button>

                <div className="text-center">
                  <p className="text-xs uppercase tracking-widest text-zinc-500">
                    Riepilogo mensile
                  </p>

                  <p className="mt-1 text-lg font-bold capitalize text-zinc-200">
                    {monthLabel}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Vai al mese successivo"
                  onClick={() =>
                    setSelectedMonth(
                      new Date(
                        selectedMonth.getFullYear(),
                        selectedMonth.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  disabled={
                    selectedMonth.getMonth() === currentMonth.getMonth() &&
                    selectedMonth.getFullYear() === currentMonth.getFullYear()
                  }
                  className="
              flex
              h-10
              w-10
              cursor-pointer
              items-center
              justify-center
              rounded-full
              border
              border-zinc-700/60
              bg-zinc-800/60
              text-lg
              text-pink-400
              transition-all
              duration-200
              hover:scale-105
              hover:border-pink-500/30
              hover:bg-pink-500/10
              active:scale-95
              disabled:cursor-not-allowed
              disabled:opacity-25
              disabled:hover:scale-100
              disabled:hover:border-zinc-700/60
              disabled:hover:bg-zinc-800/60
            "
                >
                  ›
                </button>
              </div>

              <motion.div
                key={monthLabel}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-6 text-center"
              >
                {isCurrentMonth && (
                  <span
                    className="
        mb-3
        inline-block
        rounded-full
        border
        border-pink-500/20
        bg-pink-500/10
        px-3
        py-1
        text-xs
        font-medium
        text-pink-300
      "
                  >
                    Mese corrente
                  </span>
                )}

                <p
                  className="
      text-6xl
      font-black
      tracking-tight
      text-pink-400
      drop-shadow-[0_0_20px_rgba(244,114,182,0.25)]
    "
                >
                  {monthTotal}
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  registrazioni nel mese
                </p>
              </motion.div>

              <div
                className="
            mt-5
            flex
            items-center
            justify-between
            rounded-2xl
            border
            border-zinc-800
            bg-black/30
            px-4
            py-3
          "
              >
                <span className="text-sm text-zinc-400">Media giornaliera</span>

                <span className="font-bold text-pink-300">{monthAverage}</span>
              </div>
            </div>

            <div
              className="
    rounded-3xl
    border
    border-pink-500/10
    bg-zinc-900/60
    p-5
  "
            >
              <p className="mb-4 text-sm text-zinc-400">📈 Andamento mensile</p>

              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={monthlyChartData}>
                    <XAxis dataKey="day" />
                    <YAxis />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#f472b6"
                      strokeWidth={3}
                      dot={{
                        fill: "#f472b6",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ULTIMO ANNO */}
            <div
              className="
          flex
          items-center
          justify-between
          rounded-3xl
          border
          border-pink-500/10
          bg-zinc-900/60
          p-5
          transition-all
          duration-300
          hover:-translate-y-1
          hover:border-pink-500/30
        "
            >
              <div>
                <p className="text-sm text-zinc-400">Ultimo anno</p>

                <p className="mt-1 text-xs text-zinc-500">
                  Media: {(yearlyTotal / 365).toFixed(1)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-4xl font-black text-pink-400">
                  {yearlyTotal}
                </p>

                <p className="text-xs text-zinc-500">registrazioni</p>
              </div>
            </div>

            {/* RECORD STORICO */}
            <div
              className="
          flex
          items-center
          justify-between
          rounded-3xl
          border
          border-amber-500/15
          bg-gradient-to-r
          from-amber-500/10
          to-zinc-900/60
          p-5
          transition-all
          duration-300
          hover:-translate-y-1
          hover:border-amber-500/30
        "
            >
              <div>
                <p className="text-sm text-zinc-400">Record storico</p>

                <p className="mt-1 text-xs text-zinc-500">
                  massimo in un solo giorno
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>

                <span className="text-4xl font-black text-amber-300">
                  {recordHistorical}
                </span>
              </div>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
