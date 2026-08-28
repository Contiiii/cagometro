export default function Streak({streak}) {

  return (
    <div className="text-base font-bold text-orange-400  m-3 rounded-full px-4 py-2 bg-orange-500/30 inline-block w-fit mt-10">
      🔥 Streak: {streak} {streak === 1 ? "giorno" : "giorni"}
    </div>
  );
}
