import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  createTeam,
  getMyTeam,
  getTeamInvitePreview,
  joinTeam,
  leaveTeam,
  getTeamMembers,
  transferOwnership,
  removeTeamMember,
  getTeamLeaderboard,
  updateTeam,
  toggleTeamInvites,
  regenerateInviteCode,
  getTeamActivity,
  createTeamActivity,
  createAchievementTeamActivities,
} from "./teamService";
import { supabase } from "../lib/supabase";

vi.mock("../lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function mockRpc(overrides = {}) {
  const result = {
    data: null,
    error: null,
    ...overrides,
  };

  supabase.rpc.mockResolvedValue(result);

  return result;
}

describe("createTeam", () => {
  it("chiama la rpc create_team mappando i parametri", async () => {
    mockRpc({ data: { id: "team-1" } });

    const team = await createTeam({
      name: "I Forti",
      description: "Squadra storica",
      avatarEmoji: "💩",
      maxMembers: 10,
    });

    expect(supabase.rpc).toHaveBeenCalledWith("create_team", {
      team_name: "I Forti",
      team_description: "Squadra storica",
      team_avatar_emoji: "💩",
      team_max_members: 10,
    });
    expect(team).toEqual({ id: "team-1" });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "limite raggiunto" } });

    await expect(
      createTeam({ name: "A", description: null, avatarEmoji: null, maxMembers: 10 }),
    ).rejects.toThrow("limite raggiunto");
  });
});

describe("getMyTeam", () => {
  it("chiama la rpc get_my_team e restituisce il primo elemento", async () => {
    mockRpc({ data: [{ id: "team-1", name: "I Forti" }] });

    const team = await getMyTeam();

    expect(supabase.rpc).toHaveBeenCalledWith("get_my_team");
    expect(team).toEqual({ id: "team-1", name: "I Forti" });
  });

  it("restituisce null quando il data è vuoto", async () => {
    mockRpc({ data: [] });

    await expect(getMyTeam()).resolves.toBeNull();
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "team non trovato" } });

    await expect(getMyTeam()).rejects.toThrow("team non trovato");
  });
});

describe("getTeamInvitePreview", () => {
  it("chiama la rpc get_team_invite_preview con il codice invito", async () => {
    mockRpc({ data: [{ name: "I Forti" }] });

    const preview = await getTeamInvitePreview("ABCDE");

    expect(supabase.rpc).toHaveBeenCalledWith("get_team_invite_preview", {
      p_invite_code: "ABCDE",
    });
    expect(preview).toEqual({ name: "I Forti" });
  });

  it("restituisce null quando il data è vuoto", async () => {
    mockRpc({ data: [] });

    await expect(getTeamInvitePreview("WRONG")).resolves.toBeNull();
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "invito non valido" } });

    await expect(getTeamInvitePreview("ABCDE")).rejects.toThrow("invito non valido");
  });
});

describe("joinTeam", () => {
  it("chiama la rpc join_team con il codice invito", async () => {
    mockRpc({ data: { id: "team-1" } });

    const team = await joinTeam("ABCDE");

    expect(supabase.rpc).toHaveBeenCalledWith("join_team", {
      team_invite_code: "ABCDE",
    });
    expect(team).toEqual({ id: "team-1" });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "squadra già piena" } });

    await expect(joinTeam("ABCDE")).rejects.toThrow("squadra già piena");
  });
});

describe("leaveTeam", () => {
  it("chiama la rpc leave_team senza parametri", async () => {
    mockRpc();

    await leaveTeam();

    expect(supabase.rpc).toHaveBeenCalledWith("leave_team");
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "sei l'owner" } });

    await expect(leaveTeam()).rejects.toThrow("sei l'owner");
  });
});

describe("getTeamMembers", () => {
  it("chiama la rpc get_team_members senza parametri", async () => {
    mockRpc({ data: [{ user_id: "u-1" }] });

    const members = await getTeamMembers();

    expect(supabase.rpc).toHaveBeenCalledWith("get_team_members");
    expect(members).toEqual([{ user_id: "u-1" }]);
  });

  it("restituisce una lista vuota quando il data è null", async () => {
    mockRpc({ data: null });

    await expect(getTeamMembers()).resolves.toEqual([]);
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "membri non disponibili" } });

    await expect(getTeamMembers()).rejects.toThrow("membri non disponibili");
  });
});

describe("transferOwnership", () => {
  it("chiama la rpc transfer_ownership con il nuovo owner", async () => {
    mockRpc();

    await transferOwnership("u-2");

    expect(supabase.rpc).toHaveBeenCalledWith("transfer_ownership", {
      new_owner_user_id: "u-2",
    });
  });

  it("rifiuta senza un membro selezionato", async () => {
    await expect(transferOwnership("")).rejects.toThrow(
      "Seleziona un membro a cui trasferire la proprietà.",
    );
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "trasferimento fallito" } });

    await expect(transferOwnership("u-2")).rejects.toThrow("trasferimento fallito");
  });
});

describe("removeTeamMember", () => {
  it("chiama la rpc remove_team_member con l'id del membro", async () => {
    mockRpc();

    await removeTeamMember("u-3");

    expect(supabase.rpc).toHaveBeenCalledWith("remove_team_member", {
      target_user_id: "u-3",
    });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "rimozione non permessa" } });

    await expect(removeTeamMember("u-3")).rejects.toThrow("rimozione non permessa");
  });
});

describe("getTeamLeaderboard", () => {
  it("chiama la rpc get_team_leaderboard senza parametri", async () => {
    mockRpc({ data: [{ user_id: "u-1", points: 10 }] });

    const leaderboard = await getTeamLeaderboard();

    expect(supabase.rpc).toHaveBeenCalledWith("get_team_leaderboard");
    expect(leaderboard).toEqual([{ user_id: "u-1", points: 10 }]);
  });

  it("restituisce una lista vuota quando il data è null", async () => {
    mockRpc({ data: null });

    await expect(getTeamLeaderboard()).resolves.toEqual([]);
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "classifica non disponibile" } });

    await expect(getTeamLeaderboard()).rejects.toThrow("classifica non disponibile");
  });
});

describe("updateTeam", () => {
  it("chiama la rpc update_team mappando i parametri", async () => {
    mockRpc({ data: { id: "team-1" } });

    const team = await updateTeam({
      name: "I Nuovi Forti",
      description: "Aggiornata",
      avatarEmoji: "🚽",
      maxMembers: 20,
    });

    expect(supabase.rpc).toHaveBeenCalledWith("update_team", {
      p_name: "I Nuovi Forti",
      p_description: "Aggiornata",
      p_avatar_emoji: "🚽",
      p_max_members: 20,
    });
    expect(team).toEqual({ id: "team-1" });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "aggiornamento fallito" } });

    await expect(
      updateTeam({ name: "A", description: null, avatarEmoji: null, maxMembers: 10 }),
    ).rejects.toThrow("aggiornamento fallito");
  });
});

describe("toggleTeamInvites", () => {
  it("chiama la rpc toggle_team_invites con lo stato richiesto", async () => {
    mockRpc();

    await toggleTeamInvites(true);

    expect(supabase.rpc).toHaveBeenCalledWith("toggle_team_invites", {
      p_enabled: true,
    });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "toggle fallito" } });

    await expect(toggleTeamInvites(false)).rejects.toThrow("toggle fallito");
  });
});

describe("regenerateInviteCode", () => {
  it("chiama la rpc regenerate_invite_code senza parametri", async () => {
    mockRpc({ data: "NEWCODE" });

    const code = await regenerateInviteCode();

    expect(supabase.rpc).toHaveBeenCalledWith("regenerate_invite_code");
    expect(code).toBe("NEWCODE");
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "rigenerazione troppo frequente" } });

    await expect(regenerateInviteCode()).rejects.toThrow(
      "rigenerazione troppo frequente",
    );
  });
});

describe("getTeamActivity", () => {
  it("chiama la rpc get_team_activity con limit e offset", async () => {
    mockRpc({ data: [{ type: "entry_created" }] });

    const activity = await getTeamActivity(10, 5);

    expect(supabase.rpc).toHaveBeenCalledWith("get_team_activity", {
      p_limit: 10,
      p_offset: 5,
    });
    expect(activity).toEqual([{ type: "entry_created" }]);
  });

  it("usa i valori di default quando non forniti", async () => {
    mockRpc({ data: [] });

    await getTeamActivity();

    expect(supabase.rpc).toHaveBeenCalledWith("get_team_activity", {
      p_limit: 20,
      p_offset: 0,
    });
  });

  it("restituisce una lista vuota quando il data è null", async () => {
    mockRpc({ data: null });

    await expect(getTeamActivity(20, 0)).resolves.toEqual([]);
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "attività non disponibile" } });

    await expect(getTeamActivity(20, 0)).rejects.toThrow("attività non disponibile");
  });
});

describe("createTeamActivity", () => {
  it("chiama la rpc create_team_activity con tipo, punti e metadata", async () => {
    mockRpc({ data: { id: "act-1" } });

    const activity = await createTeamActivity("entry_created", 5, { date: "2026-09-13" });

    expect(supabase.rpc).toHaveBeenCalledWith("create_team_activity", {
      p_activity_type: "entry_created",
      p_points: 5,
      p_metadata: { date: "2026-09-13" },
      p_dedup_key: null,
    });
    expect(activity).toEqual({ id: "act-1" });
  });

  it("passa la chiave di deduplicazione alla rpc", async () => {
    mockRpc({ data: { id: "act-2" } });

    const activity = await createTeamActivity("entry_created", 1, null, "dedup-1");

    expect(supabase.rpc).toHaveBeenCalledWith("create_team_activity", {
      p_activity_type: "entry_created",
      p_points: 1,
      p_metadata: null,
      p_dedup_key: "dedup-1",
    });
    expect(activity).toEqual({ id: "act-2" });
  });

  it("usa null come default per punti, metadata e dedup key", async () => {
    mockRpc({ data: null });

    await createTeamActivity("entry_created");

    expect(supabase.rpc).toHaveBeenCalledWith("create_team_activity", {
      p_activity_type: "entry_created",
      p_points: null,
      p_metadata: null,
      p_dedup_key: null,
    });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "attività rifiutata" } });

    await expect(createTeamActivity("entry_created")).rejects.toThrow(
      "attività rifiutata",
    );
  });
});

describe("createAchievementTeamActivities", () => {
  const achievements = [
    { id: "prima-cacca", title: "Prima Cacca" },
    { id: "abitudinario", title: "Abitudinario" },
  ];

  it("non genera attività se l'utente non è in squadra", async () => {
    mockRpc();

    await expect(
      createAchievementTeamActivities(achievements, null, "user-1"),
    ).resolves.toEqual([]);

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("non genera attività senza un userId valido", async () => {
    mockRpc();

    await expect(
      createAchievementTeamActivities(achievements, "team-1", null),
    ).resolves.toEqual([]);

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("non genera attività con una lista vuota", async () => {
    mockRpc();

    await expect(
      createAchievementTeamActivities([], "team-1", "user-1"),
    ).resolves.toEqual([]);

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("genera un'attività achievement_unlocked per ogni nuovo achievement", async () => {
    mockRpc();

    const results = await createAchievementTeamActivities(
      achievements,
      "team-1",
      "user-1",
    );

    expect(results).toHaveLength(2);
    expect(supabase.rpc).toHaveBeenCalledTimes(2);
    expect(supabase.rpc).toHaveBeenCalledWith("create_team_activity", {
      p_activity_type: "achievement_unlocked",
      p_points: null,
      p_metadata: { achievementId: "prima-cacca", achievementName: "Prima Cacca" },
      p_dedup_key: "user-1:achievement:prima-cacca",
    });
    expect(supabase.rpc).toHaveBeenCalledWith("create_team_activity", {
      p_activity_type: "achievement_unlocked",
      p_points: null,
      p_metadata: { achievementId: "abitudinario", achievementName: "Abitudinario" },
      p_dedup_key: "user-1:achievement:abitudinario",
    });
  });

  it("usa una dedup key stabile per lo stesso utente e diversa tra utenti", async () => {
    mockRpc();

    await createAchievementTeamActivities(achievements.slice(0, 1), "team-1", "user-1");
    await createAchievementTeamActivities(achievements.slice(0, 1), "team-1", "user-1");
    await createAchievementTeamActivities(achievements.slice(0, 1), "team-1", "user-2");

    const dedupKeys = supabase.rpc.mock.calls.map(
      (call) => call[1].p_dedup_key,
    );

    expect(dedupKeys[0]).toBe("user-1:achievement:prima-cacca");
    expect(dedupKeys[1]).toBe(dedupKeys[0]);
    expect(dedupKeys[2]).toBe("user-2:achievement:prima-cacca");
  });

  it("non propaga il fallimento di una singola activity", async () => {
    supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: "errore" } });
    supabase.rpc.mockResolvedValueOnce({ data: null, error: null });

    const results = await createAchievementTeamActivities(
      achievements,
      "team-1",
      "user-1",
    );

    expect(results[0].status).toBe("rejected");
    expect(results[1].status).toBe("fulfilled");
  });
});