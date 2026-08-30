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
      target: 1,
      progress: totalHistorical,
      unlocked: totalHistorical >= 1,
    },
    {
      title: "Abitudinario",
      description: "Raggiungi 10 registrazioni",
      icon: "🔥",
      target: 10,
      progress: totalHistorical,
      unlocked: totalHistorical >= 10,
    },
    {
      title: "Veterano",
      description: "Raggiungi 100 registrazioni",
      icon: "🏆",
      target: 100,
      progress: totalHistorical,
      unlocked: totalHistorical >= 100,
    },
    {
      title: "Costante",
      description: "Ottieni una streak di 7 giorni",
      icon: "📅",
      target: 7,
      progress: streak,
      unlocked: streak >= 7,
    },
    {
      title: "Leggenda",
      description: "Ottieni una streak di 30 giorni",
      icon: "👑",
      target: 30,
      progress: streak,
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
        <div>
          <h1 className="text-3xl font-bold text-pink-400">🏆 Achievements</h1>

          <p className="text-zinc-400 mt-1">
            {achievements.filter((achievement) => achievement.unlocked).length}{" "}
            / {achievements.length} completati
          </p>
        </div>
        {achievements.map((achievement) => (
          <div
            key={achievement.title}
            className={
              achievement.unlocked
                ? "bg-pink-500/10 border border-pink-500/20 rounded-3xl p-5 shadow-lg shadow-pink-500/10 transition-all duration-300 hover:-translate-y-1"
                : "bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 transition-all duration-300 hover:border-pink-500/30 hover:-translate-y-1"
            }
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <p
                  className={`font-bold text-lg ${
                    achievement.unlocked ? "text-white" : "text-zinc-300"
                  }`}
                >
                  {achievement.unlocked ? "✅" : "🔒"} {achievement.title}
                </p>

                <p className="text-zinc-400 text-sm">
                  {achievement.description}
                </p>

                <p className="text-xs text-zinc-500 mt-1">
                  {Math.min(
                    Math.round(
                      (achievement.progress / achievement.target) * 100,
                    ),
                    100,
                  )}
                  % completato
                </p>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full transition-all duration-500 ${
                        achievement.unlocked ? "bg-green-400" : "bg-pink-400"
                      }`}
                      style={{
                        width: `${Math.min(
                          (achievement.progress / achievement.target) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>

                  <span className="text-xs text-zinc-400 min-w-fit">
                    {Math.min(achievement.progress, achievement.target)} /{" "}
                    {achievement.target}
                  </span>
                </div>
              </div>

              <span
                className={`text-4xl ${
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
