import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

export default function Achievements() {
  const entries = JSON.parse(localStorage.getItem("entries")) || {};

  const totalHistorical = Object.values(entries).reduce(
    (sum, value) => sum + value,
    0,
  );

  function calculateStreak() {
    let streak = 0;
    const currentDate = new Date();

    while (true) {
      const dateString = currentDate.toISOString().split("T")[0];

      if ((entries[dateString] || 0) > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  const streak = calculateStreak();

  const achievements = [
  {
    title: "Prima Cacca",
    description: "Registra la tua prima cacca",
    icon: "💩",
    unlocked: totalHistorical >= 1,
  },
  {
    title: "Abitudinario",
    description: "Raggiungi 10 registrazioni",
    icon: "🔥",
    unlocked: totalHistorical >= 10,
  },
  {
    title: "Veterano",
    description: "Raggiungi 100 registrazioni",
    icon: "🏆",
    unlocked: totalHistorical >= 100,
  },
  {
    title: "Costante",
    description: "Ottieni una streak di 7 giorni",
    icon: "📅",
    unlocked: streak >= 7,
  },
  {
    title: "Leggenda",
    description: "Ottieni una streak di 30 giorni",
    icon: "👑",
    unlocked: streak >= 30,
  },
];

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
          gap-4
        "
      >
        <h1 className="text-3xl font-bold text-pink-400">🏆 Achievements</h1>

        {achievements.map((achievement) => (
  <div
    key={achievement.title}
    className={
      achievement.unlocked
        ? "bg-pink-500/10 border border-pink-500/20 rounded-3xl p-5"
        : "bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5"
    }
  >
    <div className="flex justify-between items-center">
      <div>
        <p
          className={`font-bold text-lg ${
            achievement.unlocked
              ? "text-white"
              : "text-zinc-300"
          }`}
        >
          {achievement.unlocked ? "✅" : "🔒"}{" "}
          {achievement.title}
        </p>

        <p className="text-zinc-400 text-sm">
          {achievement.description}
        </p>
      </div>

      <span
        className={`text-3xl ${
          achievement.unlocked ? "" : "opacity-50"
        }`}
      >
        {achievement.icon}
      </span>
    </div>
  </div>
))}
      </main>

      <BottomNav />
    </div>
  );
}
