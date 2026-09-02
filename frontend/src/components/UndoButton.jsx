export default function UndoButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        text-sm
        text-zinc-500
        transition-colors
        duration-200

        hover:text-red-300
      "
    >
      ↩ Annulla ultima registrazione
    </button>
  );
}
