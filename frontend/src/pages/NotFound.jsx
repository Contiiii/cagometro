import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black p-6 text-white">
      <h1 className="text-6xl font-bold text-accent-ink">
        404
      </h1>

      <p className="mt-4 text-zinc-400">
        Pagina non trovata
      </p>

      <Link
        to="/"
        className="
          mt-6
          rounded-2xl
          bg-rose-600
          px-6
          py-3
          font-semibold
          text-white
          transition-colors
          hover:bg-rose-500
        "
      >
        Torna alla Home
      </Link>
    </div>
  );
}