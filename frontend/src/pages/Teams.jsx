import { useEffect, useState } from "react";

import toast from "react-hot-toast";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

import { useTeam } from "../hooks/useTeam";

import { joinTeam } from "../services/teamService";

export default function Teams() {
  const { team, refreshTeam } = useTeam();

  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  async function handleJoinTeam() {
    const code = inviteCode.trim().toUpperCase();

    if (!code) {
      toast.error("Inserisci un codice invito");
      return;
    }

    try {
      setJoining(true);

      await joinTeam(code);

      await refreshTeam();

      toast.success("Sei entrato nella squadra");
    } catch (error) {
      console.error(error);

      toast.error(error.message);
    } finally {
      setJoining(false);
    }
  }

  useEffect(() => {
    refreshTeam().catch(console.error);
  }, [refreshTeam]);

  return (
    <div className="min-h-dvh bg-black text-white">
      <Header />

      <main className="mx-auto max-w-xl p-5">
        {!team ? (
          <div className="space-y-5">
            <h1 className="text-3xl font-bold">🏆 Squadre</h1>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="mb-3 text-xl font-semibold">
                Crea o unisciti a una squadra
              </h2>

              <p className="mb-5 text-zinc-400">
                Sfida i tuoi amici, scala la classifica e conquista il titolo di
                MVP settimanale.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full rounded-2xl bg-pink-600 p-4 font-semibold"
                >
                  ➕ Crea squadra
                </button>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="TRONO-8K4P"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="
      w-full
      rounded-2xl
      border
      border-zinc-700
      bg-zinc-800
      p-4
      text-center
      uppercase
      outline-none
    "
                  />

                  <button
                    type="button"
                    onClick={handleJoinTeam}
                    disabled={joining}
                    className="
      w-full
      rounded-2xl
      border
      border-zinc-700
      p-4
      font-semibold
      disabled:opacity-50
    "
                  >
                    {joining ? "Ingresso..." : "🎟️ Entra con codice"}
                  </button>
                </div>
                ``
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-5">
            <h1 className="text-3xl font-bold">
              {team.avatar_emoji} {team.team_name}
            </h1>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-zinc-400">
                {team.description || "Nessuna descrizione"}
              </p>

              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                <p>
                  <strong>Ruolo:</strong> {team.role}
                </p>

                <p>
                  <strong>Codice invito:</strong> {team.invite_code}
                </p>
              </div>
            </section>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
