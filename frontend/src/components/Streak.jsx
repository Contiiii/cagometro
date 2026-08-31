export default function Streak({ streak, bestStreak }) {
  return (
    <div
      className="
        bg-zinc-900/60
        border
        border-pink-500/10
        rounded-3xl
        px-6
        py-4
        flex
        flex-col
        items-center
        gap-2
      "
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔥</span>

        <p className="text-zinc-300">Streak</p>

        <p className="text-2xl font-bold text-pink-400">{streak}</p>

        <p className="text-zinc-300">{streak === 1 ? "giorno" : "giorni"}</p>
      </div>

      <div
        className="
          px-3
          py-1
          rounded-full
          bg-pink-500/10
          border
          border-pink-500/20
        "
      >
        <p className="text-sm text-zinc-300">🏆 Record: {bestStreak}</p>

        {streak === bestStreak && streak > 0 && (
          <p className="text-xs text-pink-400 font-medium">🚀 Nuovo record!</p>
        )}
      </div>
    </div>
  );
}
