

export default function UndoBotton() {
  return (
    <button
      className="bg-zinc-800/30
                border
                border-zinc-700/30
                text-zinc-400
                hover:bg-red-900/20
                hover:border-red-500/30
                hover:text-red-300
                hover:scale-105
                transition-all
                duration-200
                rounded-2xl
                py-3
                px-5
                cursor-pointer">
      ↩ Annulla ultima registrazione
    </button>
  );
}
