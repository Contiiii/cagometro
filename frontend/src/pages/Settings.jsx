import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

import { useAuth } from "../hooks/useAuth";
import { useEntries } from "../hooks/useEntries";

export default function Settings() {
  const { user, logout } = useAuth();
  const { syncStatus } = useEntries();

  const syncLabel = {
    synced: "☁️ Sincronizzato",
    pending: "🟠 Modifiche da sincronizzare",
    error: "🔴 Errore sincronizzazione",
  };

  return (
    <div className="min-h-dvh bg-black text-white">
      <Header />

      <main className="mx-auto max-w-xl space-y-5 p-5">
        <h1 className="text-3xl font-bold">⚙️ Impostazioni</h1>

        {user ? (
          <>
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="mb-3 text-lg font-semibold">👤 Account</h2>

              <p className="font-medium">{user.email}</p>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="mb-3 text-lg font-semibold">☁️ Cloud</h2>

              <p className="text-zinc-300">{syncLabel[syncStatus]}</p>
            </section>

            <button
              type="button"
              onClick={logout}
              className="
          w-full
          rounded-2xl
          bg-red-500/15
          p-4
          font-semibold
          text-red-300
          transition
          hover:bg-red-500/25
        "
            >
              🚪 Logout
            </button>
          </>
        ) : (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 text-lg font-semibold">👋 Accesso</h2>

            <p className="text-zinc-400">
              Accedi con Google per sincronizzare i dati tra dispositivi e
              attivare il backup cloud.
            </p>
          </section>
        )}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-lg font-semibold">📦 Applicazione</h2>

          <p className="text-zinc-400">Versione 1.0.0</p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
