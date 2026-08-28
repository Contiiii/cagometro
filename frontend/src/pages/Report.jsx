import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

export default function Report() {
  const entries = JSON.parse(localStorage.getItem("entries")) || {};
  const today = new Date().toISOString().split("T")[0];

  function calculateTodayCount() {
    const todayCount = entries[today] || 0;
    return todayCount;
  }

  function calculateTotalCount() {
    const totalCount = Object.values(entries).reduce(
      (sum, value) => sum + value,
      0,
    );
    return totalCount;
  }

  function calculateRecordCount() {
   const TotalCount =Object.values(entries).length > 0
    ? Math.max(...Object.values(entries))
    : 0;
    return TotalCount;
  }

  function getLastNDaysTotal(days) {
  let total = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const dateString = date.toISOString().split("T")[0];

    total += entries[dateString] || 0;
  }

  return total;
}

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

          <p className="text-5xl font-bold text-pink-400">{calculateTodayCount()}</p>
        </div>

        {/* ULTIMI 7 GIORNI */}
        <div className="bg-zinc-900/60 border border-pink-500/10 rounded-3xl p-5">
          <p className="text-zinc-400 text-sm">Ultimi 7 giorni</p>

          <p className="text-5xl font-bold text-pink-400">{getLastNDaysTotal(7)}</p>

          <p className="text-zinc-500 text-sm mt-2">Media: {(getLastNDaysTotal(7) / 7).toFixed(1)}</p>
        </div>

        {/* ULTIMI 30 GIORNI */}
        <div className="bg-zinc-900/60 border border-pink-500/10 rounded-3xl p-5">
          <p className="text-zinc-400 text-sm">Ultimi 30 giorni</p>

          <p className="text-5xl font-bold text-pink-400">{getLastNDaysTotal(30)}</p>

          <p className="text-zinc-500 text-sm mt-2">Media: {(getLastNDaysTotal(30) / 30).toFixed(1)}</p>
        </div>

        {/* ULTIMO ANNO */}
        <div className="bg-zinc-900/60 border border-pink-500/10 rounded-3xl p-5">
          <p className="text-zinc-400 text-sm">Ultimo anno</p>

          <p className="text-5xl font-bold text-pink-400">{getLastNDaysTotal(365)}</p>

          <p className="text-zinc-500 text-sm mt-2">Media: {(getLastNDaysTotal(365) / 365).toFixed(1)}</p>
        </div>

        {/* RECORD E TOTALE */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/60 border border-pink-500/10 rounded-3xl p-5">
            <p className="text-zinc-400 text-sm">🏆 Record storico</p>

            <p className="text-4xl font-bold">{calculateRecordCount()}</p>
          </div>

          <div className="bg-zinc-900/60 border border-pink-500/10 rounded-3xl p-5">
            <p className="text-zinc-400 text-sm">💩 Totale storico</p>

            <p className="text-4xl font-bold text-pink-400">{calculateTotalCount()}</p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
