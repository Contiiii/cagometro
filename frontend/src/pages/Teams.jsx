import { useEffect, useState } from "react";

import toast from "react-hot-toast";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";


import { useTeam } from "../hooks/useTeam";

import {
  createTeam,
  joinTeam,
  leaveTeam,
  transferOwnership,
} from "../services/teamService";

export default function Teams() {
  const { team, members, refreshTeam, refreshMembers } = useTeam();

  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);

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
      await refreshMembers();

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
    refreshMembers().catch(console.error);
  }, [refreshTeam, refreshMembers]);

  async function handleLeaveTeam() {
    try {
      await leaveTeam();

      await refreshTeam();
      await refreshMembers();

      toast.success("Hai lasciato la squadra");
    } catch (error) {
      console.error(error);

      toast.error(error.message);
    }
  }

  async function handleCreateTeam() {
    const name = teamName.trim();

    if (!name) {
      toast.error("Inserisci un nome squadra");
      return;
    }

    try {
      setCreating(true);

      await createTeam({
        name,
        description: null,
        avatarEmoji: "🏆",
      });

      await refreshTeam();
      await refreshMembers();

      setTeamName("");

      toast.success("Squadra creata");
    } catch (error) {
      console.error(error);

      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleTransferOwnership(userId) {
    try {
      await transferOwnership(userId);

      await refreshTeam();
      await refreshMembers();

      toast.success("Proprietà trasferita");
    } catch (error) {
      console.error(error);

      toast.error(error.message);
    }
  }


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
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nome squadra"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    maxLength={50}
                    className="
                                w-full
                                rounded-2xl
                                border
                                border-zinc-700
                                bg-zinc-800
                                p-4
                                outline-none
                              "
                  />

                  <button
                    type="button"
                    onClick={handleCreateTeam}
                    disabled={creating}
                    className="
                                w-full
                                rounded-2xl
                                bg-pink-600
                                p-4
                                font-semibold
                                disabled:opacity-50
                              "
                  >
                    {creating ? "Creazione..." : "➕ Crea squadra"}
                  </button>
                </div>
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

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <h2 className="mb-4 text-lg font-semibold">👥 Membri</h2>

                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {member.role === "owner" ? "👑" : "👤"}{" "}
                        {member.display_name || "Utente"}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-500">
                          {member.role}
                        </span>

                        {team?.role === "owner" && member.role !== "owner" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleTransferOwnership(member.user_id)
                            }
                            className="
              rounded-lg
              bg-amber-500/15
              px-2
              py-1
              text-xs
              text-amber-300
            "
                          >
                            Rendi owner
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <button
                type="button"
                onClick={handleLeaveTeam}
                className="
                            mt-4
                            w-full
                            rounded-2xl
                            bg-red-500/15
                            p-4
                            font-semibold
                            text-red-300
                          "
              >
                🚪 Lascia squadra
              </button>
            </section>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
