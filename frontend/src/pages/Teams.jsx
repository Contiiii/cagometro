import { useEffect, useState } from "react";

import toast from "react-hot-toast";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

import { useTeam } from "../hooks/useTeam";

import { useAuth } from "../hooks/useAuth";

import {
  createTeam,
  joinTeam,
  leaveTeam,
  transferOwnership,
  removeTeamMember,
} from "../services/teamService";

export default function Teams() {
  const {
    team,
    members,
    leaderboard,
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
  } = useTeam();

  const teamTotal = leaderboard.reduce(
    (sum, player) => sum + Number(player.total_count),
    0,
  );

  const [showCreateTeam, setShowCreateTeam] = useState(false);

  const [showJoinTeam, setShowJoinTeam] = useState(false);

  const [teamDescription, setTeamDescription] = useState("");

  const [teamEmoji, setTeamEmoji] = useState("🏆");

  const { user } = useAuth();

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
    refreshLeaderboard().catch(console.error);
  }, [refreshTeam, refreshMembers, refreshLeaderboard]);

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
        description: teamDescription || null,
        avatarEmoji: teamEmoji,
      });

      await refreshTeam();
      await refreshMembers();

      setTeamName("");

      toast.success("Squadra creata");

      setTeamName("");
      setTeamDescription("");
      setTeamEmoji("🏆");

      setShowCreateTeam(false);
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

  async function handleRemoveMember(userId) {
    try {
      await removeTeamMember(userId);

      await refreshMembers();

      toast.success("Membro rimosso");
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
                MVP.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTeam(true);
                    setShowJoinTeam(false);
                  }}
                  className="
                  w-full
                  rounded-2xl
                  bg-pink-600
                  p-4
                  font-semibold
                "
                >
                  ➕ Crea squadra
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowJoinTeam(true);
                    setShowCreateTeam(false);
                  }}
                  className="
                  w-full
                  rounded-2xl
                  border
                  border-zinc-700
                  p-4
                  font-semibold
                "
                >
                  🎟️ Entra con codice
                </button>
              </div>
            </section>

            {showCreateTeam && (
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="mb-4 text-lg font-semibold">➕ Nuova squadra</h3>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nome squadra"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="
                    w-full
                    rounded-2xl
                    border
                    border-zinc-700
                    bg-zinc-800
                    p-4
                  "
                  />

                  <textarea
                    placeholder="Descrizione"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    maxLength={150}
                    className="
                    w-full
                    rounded-2xl
                    border
                    border-zinc-700
                    bg-zinc-800
                    p-4
                  "
                  />

                  <input
                    type="text"
                    placeholder="🏆"
                    value={teamEmoji}
                    onChange={(e) => setTeamEmoji(e.target.value)}
                    maxLength={2}
                    className="
                    w-full
                    rounded-2xl
                    border
                    border-zinc-700
                    bg-zinc-800
                    p-4
                    text-center
                    text-2xl
                  "
                  />

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-800/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{teamEmoji || "🏆"}</div>

                      <div>
                        <p className="font-semibold">
                          {teamName || "Nome squadra"}
                        </p>

                        <p className="text-sm text-zinc-400">
                          {teamDescription || "Descrizione squadra"}
                        </p>
                      </div>
                    </div>
                  </div>

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
                    {creating ? "Creazione..." : "Crea squadra"}
                  </button>
                </div>
              </section>
            )}

            {showJoinTeam && (
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="mb-4 text-lg font-semibold">🎟️ Codice invito</h3>

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
                  "
                  >
                    {joining ? "Ingresso..." : "Entra nella squadra"}
                  </button>
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-500/15 text-3xl">
                  {team.avatar_emoji}
                </div>

                <div>
                  <h1 className="text-3xl font-bold">{team.team_name}</h1>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(team.invite_code);
                      toast.success("Codice copiato");
                    }}
                    className="
                                mt-2
                                rounded-full
                                bg-zinc-800
                                px-3
                                py-1
                                text-xs
                                text-zinc-400
                                hover:bg-zinc-700
                              "
                  >
                    🎟️ Codice invito · {team.invite_code}
                  </button>

                  <p className="mt-2 text-zinc-400">
                    {team.description || "Nessuna descrizione"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
                <h2 className="mb-4 text-lg font-semibold">🏆 Classifica</h2>

                <div className="space-y-2">
                  {leaderboard.map((player, index) => (
                    <div
                      key={player.user_id}
                      className={`flex items-center justify-between rounded-xl p-3 ${
                        index === 0
                          ? "border border-amber-500/20 bg-amber-500/10"
                          : "bg-zinc-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center">
                          {index === 0
                            ? "🥇"
                            : index === 1
                              ? "🥈"
                              : index === 2
                                ? "🥉"
                                : `#${index + 1}`}
                        </span>

                        <span>
                          {player.display_name || "Utente"}

                          {player.user_id === user?.id && " (tu)"}
                        </span>
                      </div>

                      <span className="font-bold text-pink-400">
                        {player.total_count}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-300">
                      Totale squadra
                    </span>

                    <span className="text-lg font-bold text-pink-400">
                      {teamTotal}
                    </span>
                  </div>
                </div>
              </section>
              <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
                <h2 className="mb-4 text-lg font-semibold">
                  👥 Membri ({members.length}/10)
                </h2>

                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.user_id}
                      className="
                      flex
                      items-center
                      justify-between
                      rounded-2xl
                      border
                      border-zinc-800
                      bg-zinc-800/40
                      p-3
                    "
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 font-semibold">
                          {(member.display_name || "?").charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="font-medium">
                            {member.display_name || "Utente"}

                            {member.user_id === user?.id && (
                              <span className="ml-2 text-xs text-pink-400">
                                (tu)
                              </span>
                            )}
                          </p>

                          {member.role === "owner" && (
                            <p className="text-xs text-amber-400">👑 Owner</p>
                          )}
                        </div>
                      </div>

                      {team.role === "owner" && member.role !== "owner" && (
                        <div className="flex gap-2">
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
                            Owner
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="
                              rounded-lg
                              bg-red-500/15
                              px-2
                              py-1
                              text-xs
                              text-red-300
                            "
                          >
                            Rimuovi
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <button
                type="button"
                onClick={handleLeaveTeam}
                className="
                mt-5
                w-full
                rounded-2xl
                border
                border-red-500/20
                bg-red-500/10
                p-4
                font-semibold
                text-red-300
                transition
                hover:bg-red-500/20
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
