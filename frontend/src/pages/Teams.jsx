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
  updateTeam,
  toggleTeamInvites,
  transferOwnership,
  removeTeamMember,
  regenerateInviteCode,
  createTeamActivity,
} from "../services/teamService";

export default function Teams() {
  const {
    team,
    members,
    leaderboard,
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
    activity,
    refreshActivity,
  } = useTeam();

  const teamTotal = leaderboard.reduce(
    (sum, player) => sum + Number(player.weekly_total),
    0,
  );

  const [showCreateTeam, setShowCreateTeam] = useState(false);

  const [showJoinTeam, setShowJoinTeam] = useState(false);

  const [teamDescription, setTeamDescription] = useState("");

  const [teamEmoji, setTeamEmoji] = useState("🏆");

  const [editingTeam, setEditingTeam] = useState(false);

  const [editName, setEditName] = useState("");

  const [editDescription, setEditDescription] = useState("");

  const [editEmoji, setEditEmoji] = useState("🏆");

  const [regenerating, setRegenerating] = useState(false);

  const { user } = useAuth();

  const [activityLimit, setActivityLimit] = useState(5);

  const visibleActivity = activity.slice(0, activityLimit);

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

      await createTeamActivity("member_joined");

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
    refreshActivity().catch(console.error);
  }, [refreshTeam, refreshMembers, refreshLeaderboard, refreshActivity]);

  async function handleLeaveTeam() {
    try {
      if (!window.confirm("Vuoi davvero lasciare la squadra?")) {
        return;
      }

      await createTeamActivity("member_left");

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
      await createTeamActivity("ownership_transferred", null, {
        targetUserId: userId,
      });

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
      if (!window.confirm("Vuoi davvero rimuovere questo membro?")) {
        return;
      }

      await createTeamActivity("member_removed", null, {
        targetUserId: userId,
      });

      await removeTeamMember(userId);

      await refreshMembers();

      toast.success("Membro rimosso");
    } catch (error) {
      console.error(error);

      toast.error(error.message);
    }
  }

  function handleStartEdit() {
    setEditName(team.name ?? team.team_name);

    setEditDescription(team.description ?? "");

    setEditEmoji(team.avatar_emoji ?? "🏆");

    setEditingTeam(true);
  }

  async function handleUpdateTeam() {
    try {
      await updateTeam({
        name: editName,
        description: editDescription,
        avatarEmoji: editEmoji,
      });

      await refreshTeam();
      await refreshMembers();

      setEditingTeam(false);

      toast.success("Squadra aggiornata");
    } catch (error) {
      console.error(error);

      toast.error(error.message);
    }
  }

  async function handleToggleInvites() {
    try {
      await toggleTeamInvites(!team.invite_enabled);

      await refreshTeam();

      toast.success(
        team.invite_enabled ? "Inviti disattivati" : "Inviti attivati",
      );
    } catch (error) {
      console.error(error);

      toast.error(error.message);
    }
  }

  async function handleRegenerateCode() {
    try {
      setRegenerating(true);

      await regenerateInviteCode();

      await refreshTeam();

      toast.success("Codice rigenerato");
    } catch (error) {
      console.error(error);

      toast.error(error.message);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="min-h-dvh bg-black text-white">
      <Header />

      <main className="mx-auto max-w-xl p-5 pb-28">
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
                    transition-transform
active:scale-95
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
                    transition-transform
active:scale-95
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
            <section
              className="
    rounded-3xl
    border
    border-pink-500/10
    bg-gradient-to-br
    from-zinc-900
    to-zinc-950
    p-6
    shadow-lg
    shadow-pink-500/5
    transition-all
    duration-300
  "
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-500/15 text-3xl">
                  {team.avatar_emoji}
                </div>

                <div>
                  <h1 className="text-3xl font-bold">{team.team_name}</h1>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(team.invite_code);
                        toast.success("Codice copiato");
                      }}
                      className="
      rounded-lg
      bg-pink-500/10
      px-3
      py-1
      text-xs
      font-medium
      text-pink-300
    "
                    >
                      {team.invite_code}
                    </button>

                    {team.role === "owner" && (
                      <>
                        <button
                          type="button"
                          onClick={handleRegenerateCode}
                          className="
    rounded-lg
    bg-amber-500/15
    px-3
    py-1
    text-xs
    text-amber-300
    transition-transform
    active:scale-95
  "
                        >
                          <span
                            className={
                              regenerating
                                ? "inline-block animate-[spin_2s_linear_infinite]"
                                : ""
                            }
                          >
                            🔄{" "}
                          </span>
                          Invito
                        </button>

                        <button
                          type="button"
                          onClick={handleStartEdit}
                          className="
          rounded-lg
          bg-zinc-800
          px-3
          py-1
          text-xs
          text-zinc-300
        "
                        >
                          Modifica
                        </button>
                      </>
                    )}
                  </div>

                  <p className="mt-2 text-zinc-400">
                    {team.description || "Nessuna descrizione"}
                  </p>
                </div>
              </div>
            </section>

            {editingTeam ? (
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <h2 className="mb-4 text-lg font-semibold">
                  ✏️ Modifica squadra
                </h2>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
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
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
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
                    value={editEmoji}
                    maxLength={2}
                    onChange={(e) => setEditEmoji(e.target.value)}
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

                  <button
                    type="button"
                    onClick={handleToggleInvites}
                    className={`
                      w-full
                      rounded-2xl
                      p-4
                      font-medium
                      ${
                        team.invite_enabled
                          ? "bg-green-500/15 text-green-300"
                          : "bg-red-500/15 text-red-300"
                      }
                    `}
                  >
                    {team.invite_enabled
                      ? "✅ Inviti attivi"
                      : "❌ Inviti disattivati"}
                  </button>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-800/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{editEmoji || "🏆"}</div>

                      <div>
                        <p className="font-semibold">
                          {editName || "Nome squadra"}
                        </p>

                        <p className="text-sm text-zinc-400">
                          {editDescription || "Descrizione squadra"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTeam(false)}
                      className="
                        flex-1
                        rounded-2xl
                        border
                        border-zinc-700
                        p-3
                      "
                    >
                      Annulla
                    </button>

                    <button
                      type="button"
                      onClick={handleUpdateTeam}
                      className="
                        flex-1
                        rounded-2xl
                        bg-pink-600
                        p-3
                        font-semibold
                      "
                    >
                      Salva
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <>
                <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
                  <h2 className="mb-4 text-lg font-semibold">🏆 Classifica</h2>

                  {leaderboard.length === 0 ? (
                    <div className="text-center text-zinc-500">
                      Nessun punteggio disponibile
                    </div>
                  ) : (
                    <>
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

                              <div>
                                <div>
                                  {player.display_name}
                                  {player.user_id === user?.id && " (tu)"}
                                </div>

                                <div className="text-xs text-zinc-500">
                                  Storico: {player.lifetime_total}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-bold text-pink-400">
                                {player.weekly_total}
                              </div>

                              <div className="text-xs text-zinc-500">
                                settimana
                              </div>
                            </div>
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
                    </>
                  )}
                </section>
                <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
                  <h2 className="mb-4 text-lg font-semibold">
                    📢 Attività recenti
                  </h2>

                  {activity.length > 0 && (
                    <p className="mb-3 text-xs text-zinc-500">
                      Mostrate {visibleActivity.length} di {activity.length}
                    </p>
                  )}

                  {activity.length === 0 ? (
                    <div className="text-center text-zinc-500">
                      Nessuna attività disponibile
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visibleActivity.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl bg-zinc-800/40 px-3 py-2"
                        >
                          <p className="text-sm text-zinc-300">
                            {item.activity_type === "entry_created" && (
                              <>
                                🔥 {item.display_name} ha registrato{" "}
                                <span className="font-semibold text-pink-400">
                                  {item.points}
                                </span>{" "}
                                {item.points === 1 ? "punto" : "punti"}
                              </>
                            )}

                            {item.activity_type === "member_joined" && (
                              <>
                                👋 {item.display_name} è entrato nella squadra
                              </>
                            )}

                            {item.activity_type === "member_left" && (
                              <>🚪 {item.display_name} ha lasciato la squadra</>
                            )}

                            {item.activity_type === "ownership_transferred" && (
                              <>
                                👑 {item.display_name} ha trasferito la
                                proprietà
                              </>
                            )}

                            {item.activity_type === "member_removed" && (
                              <>❌ {item.display_name} ha rimosso un membro</>
                            )}
                          </p>

                          <p className="text-[11px] text-zinc-500">
                            {new Date(item.created_at).toLocaleString("it-IT")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                <div className="mt-4 flex gap-2">
                  {activity.length > visibleActivity.length && (
                    <button
                      type="button"
                      onClick={() => setActivityLimit((prev) => prev + 5)}
                      className="
        flex-1
        rounded-xl
        border
        border-zinc-700
        bg-zinc-800/40
        p-3
        text-sm
        font-medium
        text-zinc-300
      "
                    >
                      Carica altre
                    </button>
                  )}

                  {activityLimit > 5 && (
                    <button
                      type="button"
                      onClick={() => setActivityLimit(5)}
                      className="
        flex-1
        rounded-xl
        border
        border-zinc-700
        bg-zinc-900
        p-3
        text-sm
        font-medium
        text-zinc-400
      "
                    >
                      Mostra meno
                    </button>
                  )}
                </div>
                <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
                  <h2 className="mb-4 text-lg font-semibold">
                    👥 Membri ({members.length}/10)
                  </h2>

                  {members.length === 0 ? (
                    <div className="text-center text-zinc-500">
                      Nessun membro presente
                    </div>
                  ) : (
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
                              {(member.display_name || "?")
                                .charAt(0)
                                .toUpperCase()}
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
                                <p className="text-xs text-amber-400">
                                  👑 Owner
                                </p>
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
                                onClick={() =>
                                  handleRemoveMember(member.user_id)
                                }
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
                  )}
                </section>
                <button
                  type="button"
                  onClick={handleLeaveTeam}
                  className="
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
                    transition-transform
active:scale-95
                  "
                >
                  🚪 Lascia squadra
                </button>
              </>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
