import { useState } from "react";

import toast from "react-hot-toast";

import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

import { useAuth } from "../hooks/useAuth";
import { useEntries } from "../hooks/useEntries";
import { useProfile } from "../hooks/useProfile";



export default function Settings() {
  const { user, logout } = useAuth();
  const { syncStatus } = useEntries();
  const { profile, updateProfile } = useProfile();

  const [draftName, setDraftName] = useState(null);
  const [saving, setSaving] = useState(false);

  const displayName = draftName ?? profile?.display_name ?? "";

  const syncLabel = {
    synced: "☁️ Sincronizzato",
    pending: "🟠 Modifiche da sincronizzare",
    error: "🔴 Errore sincronizzazione",
  };

  async function handleSaveProfile() {
    const trimmedName = displayName.trim();

    if (trimmedName === profile?.display_name) {
      return;
    }

    if (!trimmedName) {
      toast.error("Inserisci un nome pubblico");
      return;
    }

    try {
      setSaving(true);

      await updateProfile({
        displayName: trimmedName,
        avatarUrl: profile?.avatar_url ?? null,
      });

      setDraftName(null);

      toast.success("Profilo aggiornato");
    } catch (error) {
      console.error(error);

      toast.error("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="min-h-dvh bg-black text-white">
      <Header />

      <main className="mx-auto max-w-xl space-y-5 p-5 pb-28">
        <h1 className="text-3xl font-bold">⚙️ Impostazioni</h1>

        {user ? (
          <>
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="mb-4 text-lg font-semibold">👤 Account</h2>

              <div className="mb-4 flex items-center gap-4">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName || "Avatar profilo"}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700 text-xl font-bold">
                    {(displayName || "?").charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <p className="font-medium">
                    {profile?.display_name ?? "Utente"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="display-name"
                    className="mb-2 block text-sm text-zinc-400"
                  >
                    Nome pubblico
                  </label>

                  <input
                    id="display-name"
                    type="text"
                    maxLength={50}
                    value={displayName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="
          w-full
          rounded-xl
          border
          border-zinc-700
          bg-zinc-800
          px-3
          py-2
          text-white
          outline-none
        "
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm text-zinc-400">Email</p>

                  <p>{user.email}</p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="
        rounded-xl
        bg-blue-600
        px-4
        py-2
        font-medium
        text-white
        transition
        hover:bg-blue-500
        disabled:opacity-50
      "
                >
                  {saving ? "Salvataggio..." : "Salva profilo"}
                </button>
              </div>
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
