import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

import {
  getLastNDaysTotal,
  getRecordHistorical,
  getTotalHistorical,
} from "../utils/stats";

export default function Report() {
  const entries = JSON.parse(localStorage.getItem("entries")) || {};
  const today = new Date().toISOString().split("T")[0];

  function calculateTodayCount() {
    const todayCount = entries[today] || 0;
    return todayCount;
  }

  const totalHistorical = getTotalHistorical(entries);
  const recordHistorical = getRecordHistorical(entries);

  return (
    <div
      className="
        min-h-screen
        bg-black
        text-white
        flex
        flex-col
        pb-24
      "
    >
      <Header />

      <main
        className="
          flex-1
          px-6
          py-8
          flex
          flex-col
          gap-5
        "
      >
        <h1 className="text-3xl font-bold text-pink-400">📊 Report</h1>

        {/* OGGI */}
        <div className="bg-zinc-900/60 border border-pink-500/10 rounded-3xl p-5">
          <p className="text-zinc-400 text-sm">Oggi</p>

          <p className="text-5xl font-bold text-pink-400">
            {calculateTodayCount()}
          </p>
        </div>

        {/* ULTIMI 7 GIORNI */}
        <div className="bg-zinc-900/60 border border-pink-500/10 rounded-3xl p-5">
          <p className="text-zinc-400 text-sm">Ultimi 7 giorni</p>

          <p className="text-5xl font-bold text-pink-400">
            {getLastNDaysTotal(entries, 7)}
          </p>

          <p className="text-zinc-500 text-sm mt-2">
            Media: {(getLastNDaysTotal(entries, 7) / 7).toFixed(1)}
          </p>
        </div>

        {/* ULTIMI 30 GIORNI */}
        <div className="bg-zinc-900/60 border border-pink-500/10 rounded-3xl p-5">
          <p className="text-zinc-400 text-sm">Ultimi 30 giorni</p>

          <p className="text-5xl font-bold text-pink-400">
            {getLastNDaysTotal(entries, 30)}
          </p>

          <p className="text-zinc-500 text-sm mt-2">
            Media: {(getLastNDaysTotal(entries, 30) / 30).toFixed(1)}
          </p>
        </div>

        {/* ULTIMO ANNO */}
        <div className="bg-zinc-900/60 border border-pink-500/10 rounded-3xl p-5">
          <p className="text-zinc-400 text-sm">Ultimo anno</p>

          <p className="text-5xl font-bold text-pink-400">
            {getLastNDaysTotal(entries,365)}
          </p>

          <p className="text-zinc-500 text-sm mt-2">
            Media: {(getLastNDaysTotal(entries,365) / 365).toFixed(1)}
          </p>
        </div>

        {/* RECORD E TOTALE */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/60 border border-pink-500/10 rounded-3xl p-5">
            <p className="text-zinc-400 text-sm">🏆 Record storico</p>

            <p className="text-4xl font-bold">{recordHistorical}</p>
          </div>

          <div className="bg-zinc-900/60 border border-pink-500/10 rounded-3xl p-5">
            <p className="text-zinc-400 text-sm">💩 Totale storico</p>

            <p className="text-4xl font-bold text-pink-400">
              {totalHistorical}
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
