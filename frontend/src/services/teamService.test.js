import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  createTeam,
  getMyTeams,
  getTeam,
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
  removeTeamActivity,
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
  it("chiama la rpc create_team e mappa i parametri", async () => {
    mockRpc({ data: "team-uuid-1" });

    const teamId = await createTeam({
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
    expect(teamId).toBe("team-uuid-1");
  });

  it("propaga l'errore del database (limite squadre)", async () => {
    mockRpc({
      error: { message: "Hai raggiunto il limite massimo di 3 squadre" },
    });

    await expect(
      createTeam({
        name: "A",
        description: null,
        avatarEmoji: null,
        maxMembers: 10,
      }),
    ).rejects.toThrow("Hai raggiunto il limite massimo di 3 squadre");
  });
});

describe("getMyTeams", () => {
  it("chiama la rpc get_my_teams e restituisce la lista", async () => {
    const teams = [
      { team_id: "team-a", team_name: "Alpha" },
      { team_id: "team-b", team_name: "Beta" },
    ];
    mockRpc({ data: teams });

    const result = await getMyTeams();

    expect(supabase.rpc).toHaveBeenCalledWith("get_my_teams");
    expect(result).toEqual(teams);
  });

  it("restituisce array vuoto quando data è null", async () => {
    mockRpc({ data: null });

    await expect(getMyTeams()).resolves.toEqual([]);
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "rete ko" } });

    await expect(getMyTeams()).rejects.toThrow("rete ko");
  });
});

describe("getTeam", () => {
  it("chiama la rpc get_team con p_team_id", async () => {
    mockRpc({ data: [{ team_id: "team-a", team_name: "Alpha" }] });

    const team = await getTeam("team-a");

    expect(supabase.rpc).toHaveBeenCalledWith("get_team", {
      p_team_id: "team-a",
    });
    expect(team).toEqual({ team_id: "team-a", team_name: "Alpha" });
  });

  it("restituisce null quando data è vuoto", async () => {
    mockRpc({ data: [] });

    await expect(getTeam("missing")).resolves.toBeNull();
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "squadra non trovata" } });

    await expect(getTeam("x")).rejects.toThrow("squadra non trovata");
  });
});

describe("getTeamInvitePreview", () => {
  it("chiama la rpc con il codice invito", async () => {
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

    await expect(getTeamInvitePreview("ABCDE")).rejects.toThrow(
      "invito non valido",
    );
  });
});

describe("joinTeam", () => {
  it("chiama la rpc join_team e ritorna il team id", async () => {
    mockRpc({ data: "team-uuid-joined" });

    const teamId = await joinTeam("ABCDE");

    expect(supabase.rpc).toHaveBeenCalledWith("join_team", {
      team_invite_code: "ABCDE",
    });
    expect(teamId).toBe("team-uuid-joined");
  });

  it("propaga l'errore limite squadre", async () => {
    mockRpc({
      error: { message: "Hai raggiunto il limite massimo di 3 squadre" },
    });

    await expect(joinTeam("ABCDE")).rejects.toThrow(
      "Hai raggiunto il limite massimo di 3 squadre",
    );
  });

  it("propaga l'errore squadra piena", async () => {
    mockRpc({ error: { message: "La squadra è piena" } });

    await expect(joinTeam("ABCDE")).rejects.toThrow("La squadra è piena");
  });
});

describe("leaveTeam", () => {
  it("chiama la rpc leave_team con p_team_id", async () => {
    mockRpc();

    await leaveTeam("team-a");

    expect(supabase.rpc).toHaveBeenCalledWith("leave_team", {
      p_team_id: "team-a",
    });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "sei l'owner, trasferisci prima" } });

    await expect(leaveTeam("team-a")).rejects.toThrow(
      "sei l'owner, trasferisci prima",
    );
  });
});

describe("getTeamMembers", () => {
  it("chiama la rpc get_team_members con p_team_id", async () => {
    mockRpc({ data: [{ user_id: "u-1" }] });

    const members = await getTeamMembers("team-a");

    expect(supabase.rpc).toHaveBeenCalledWith("get_team_members", {
      p_team_id: "team-a",
    });
    expect(members).toEqual([{ user_id: "u-1" }]);
  });

  it("restituisce una lista vuota quando data è null", async () => {
    mockRpc({ data: null });

    await expect(getTeamMembers("team-a")).resolves.toEqual([]);
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "membri non disponibili" } });

    await expect(getTeamMembers("team-a")).rejects.toThrow(
      "membri non disponibili",
    );
  });
});

describe("transferOwnership", () => {
  it("chiama la rpc con il nuovo owner e p_team_id", async () => {
    mockRpc();

    await transferOwnership("u-2", "team-a");

    expect(supabase.rpc).toHaveBeenCalledWith("transfer_ownership", {
      new_owner_user_id: "u-2",
      p_team_id: "team-a",
    });
  });

  it("rifiuta senza un membro selezionato", async () => {
    await expect(transferOwnership("", "team-a")).rejects.toThrow(
      "Seleziona un membro a cui trasferire la proprietà.",
    );
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "trasferimento fallito" } });

    await expect(transferOwnership("u-2", "team-a")).rejects.toThrow(
      "trasferimento fallito",
    );
  });
});

describe("removeTeamMember", () => {
  it("chiama la rpc con l'id del membro e p_team_id", async () => {
    mockRpc();

    await removeTeamMember("u-3", "team-a");

    expect(supabase.rpc).toHaveBeenCalledWith("remove_team_member", {
      target_user_id: "u-3",
      p_team_id: "team-a",
    });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "rimozione non permessa" } });

    await expect(removeTeamMember("u-3", "team-a")).rejects.toThrow(
      "rimozione non permessa",
    );
  });
});

describe("getTeamLeaderboard", () => {
  it("chiama la rpc get_team_leaderboard con p_team_id", async () => {
    mockRpc({ data: [{ user_id: "u-1", weekly_total: 10 }] });

    const leaderboard = await getTeamLeaderboard("team-a");

    expect(supabase.rpc).toHaveBeenCalledWith("get_team_leaderboard", {
      p_team_id: "team-a",
    });
    expect(leaderboard).toEqual([{ user_id: "u-1", weekly_total: 10 }]);
  });

  it("restituisce una lista vuota quando data è null", async () => {
    mockRpc({ data: null });

    await expect(getTeamLeaderboard("team-a")).resolves.toEqual([]);
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "classifica non disponibile" } });

    await expect(getTeamLeaderboard("team-a")).rejects.toThrow(
      "classifica non disponibile",
    );
  });
});

describe("updateTeam", () => {
  it("chiama la rpc con tutti i parametri e p_team_id", async () => {
    mockRpc({ data: "team-a" });

    const result = await updateTeam(
      {
        name: "I Nuovi Forti",
        description: "Aggiornata",
        avatarEmoji: "🚽",
        maxMembers: 20,
      },
      "team-a",
    );

    expect(supabase.rpc).toHaveBeenCalledWith("update_team", {
      p_name: "I Nuovi Forti",
      p_description: "Aggiornata",
      p_avatar_emoji: "🚽",
      p_max_members: 20,
      p_team_id: "team-a",
    });
    expect(result).toBe("team-a");
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "aggiornamento fallito" } });

    await expect(
      updateTeam(
        {
          name: "A",
          description: null,
          avatarEmoji: null,
          maxMembers: 10,
        },
        "team-a",
      ),
    ).rejects.toThrow("aggiornamento fallito");
  });
});

describe("toggleTeamInvites", () => {
  it("chiama la rpc con lo stato richiesto e p_team_id", async () => {
    mockRpc();

    await toggleTeamInvites(true, "team-a");

    expect(supabase.rpc).toHaveBeenCalledWith("toggle_team_invites", {
      p_enabled: true,
      p_team_id: "team-a",
    });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "toggle fallito" } });

    await expect(toggleTeamInvites(false, "team-a")).rejects.toThrow(
      "toggle fallito",
    );
  });
});

describe("regenerateInviteCode", () => {
  it("chiama la rpc con p_team_id", async () => {
    mockRpc({ data: "NEWCODE" });

    const code = await regenerateInviteCode("team-a");

    expect(supabase.rpc).toHaveBeenCalledWith("regenerate_invite_code", {
      p_team_id: "team-a",
    });
    expect(code).toBe("NEWCODE");
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "rigenerazione troppo frequente" } });

    await expect(regenerateInviteCode("team-a")).rejects.toThrow(
      "rigenerazione troppo frequente",
    );
  });
});

describe("getTeamActivity", () => {
  it("chiama la rpc con limit, offset e p_team_id", async () => {
    mockRpc({ data: [{ type: "entry_created" }] });

    const activity = await getTeamActivity(10, 5, "team-a");

    expect(supabase.rpc).toHaveBeenCalledWith("get_team_activity", {
      p_limit: 10,
      p_offset: 5,
      p_team_id: "team-a",
    });
    expect(activity).toEqual([{ type: "entry_created" }]);
  });

  it("usa i valori di default quando non forniti", async () => {
    mockRpc({ data: [] });

    await getTeamActivity(20, 0, "team-a");

    expect(supabase.rpc).toHaveBeenCalledWith("get_team_activity", {
      p_limit: 20,
      p_offset: 0,
      p_team_id: "team-a",
    });
  });

  it("restituisce una lista vuota quando data è null", async () => {
    mockRpc({ data: null });

    await expect(getTeamActivity(20, 0, "team-a")).resolves.toEqual([]);
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "attività non disponibile" } });

    await expect(getTeamActivity(20, 0, "team-a")).rejects.toThrow(
      "attività non disponibile",
    );
  });
});

describe("createTeamActivity", () => {
  it("chiama la rpc con tutti i parametri inclusi p_team_ids", async () => {
    mockRpc({ data: ["id-1", "id-2"] });

    const result = await createTeamActivity(
      "entry_created",
      5,
      { date: "2026-09-13" },
      "dedup-1",
      ["team-a", "team-b"],
    );

    expect(supabase.rpc).toHaveBeenCalledWith("create_team_activity", {
      p_activity_type: "entry_created",
      p_points: 5,
      p_metadata: { date: "2026-09-13" },
      p_dedup_key: "dedup-1",
      p_team_ids: ["team-a", "team-b"],
    });
    expect(result).toEqual(["id-1", "id-2"]);
  });

  it("usa null come default per teamIds", async () => {
    mockRpc({ data: ["id-1"] });

    await createTeamActivity("entry_created", 1, null, "dedup-1");

    expect(supabase.rpc).toHaveBeenCalledWith(
      "create_team_activity",
      expect.objectContaining({ p_team_ids: null }),
    );
  });

  it("usa null come default per punti, metadata e dedup key", async () => {
    mockRpc({ data: [] });

    await createTeamActivity("entry_created");

    expect(supabase.rpc).toHaveBeenCalledWith("create_team_activity", {
      p_activity_type: "entry_created",
      p_points: null,
      p_metadata: null,
      p_dedup_key: null,
      p_team_ids: null,
    });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "attività rifiutata" } });

    await expect(createTeamActivity("entry_created")).rejects.toThrow(
      "attività rifiutata",
    );
  });
});

describe("removeTeamActivity", () => {
  it("chiama la rpc con tipo, dedup key e p_team_ids", async () => {
    mockRpc({ data: 1 });

    const removed = await removeTeamActivity(
      "entry_created",
      "dedup-1",
      ["team-a"],
    );

    expect(supabase.rpc).toHaveBeenCalledWith("remove_team_activity", {
      p_activity_type: "entry_created",
      p_dedup_key: "dedup-1",
      p_team_ids: ["team-a"],
    });
    expect(removed).toBe(1);
  });

  it("usa null come default per teamIds", async () => {
    mockRpc({ data: 0 });

    await removeTeamActivity("entry_created", "dedup-1");

    expect(supabase.rpc).toHaveBeenCalledWith(
      "remove_team_activity",
      expect.objectContaining({ p_team_ids: null }),
    );
  });

  it("usa entry_created e null come default", async () => {
    mockRpc({ data: 0 });

    await removeTeamActivity();

    expect(supabase.rpc).toHaveBeenCalledWith("remove_team_activity", {
      p_activity_type: "entry_created",
      p_dedup_key: null,
      p_team_ids: null,
    });
  });

  it("propaga l'errore del database", async () => {
    mockRpc({ error: { message: "rimozione rifiutata" } });

    await expect(removeTeamActivity()).rejects.toThrow("rimozione rifiutata");
  });
});

describe("createAchievementTeamActivities", () => {
  const achievements = [
    { id: "prima-cacca", title: "Prima Cacca" },
    { id: "abitudinario", title: "Abitudinario" },
  ];

  it("non genera attività se teamIds non è un array valido", async () => {
    mockRpc();

    await expect(
      createAchievementTeamActivities(achievements, null, "user-1"),
    ).resolves.toEqual([]);

    await expect(
      createAchievementTeamActivities(achievements, [], "user-1"),
    ).resolves.toEqual([]);

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("non genera attività senza un userId valido", async () => {
    mockRpc();

    await expect(
      createAchievementTeamActivities(achievements, ["team-a"], null),
    ).resolves.toEqual([]);

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("non genera attività con una lista vuota", async () => {
    mockRpc();

    await expect(
      createAchievementTeamActivities([], ["team-a"], "user-1"),
    ).resolves.toEqual([]);

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("genera un'attività per ogni achievement con dedup key che include team ids", async () => {
    mockRpc();

    const results = await createAchievementTeamActivities(
      achievements,
      ["team-a", "team-b"],
      "user-1",
    );

    expect(results).toHaveLength(2);
    expect(supabase.rpc).toHaveBeenCalledTimes(2);
    expect(supabase.rpc).toHaveBeenCalledWith("create_team_activity", {
      p_activity_type: "achievement_unlocked",
      p_points: null,
      p_metadata: {
        achievementId: "prima-cacca",
        achievementName: "Prima Cacca",
      },
      p_dedup_key: "team-a:team-b:user-1:achievement:prima-cacca",
      p_team_ids: ["team-a", "team-b"],
    });
    expect(supabase.rpc).toHaveBeenCalledWith("create_team_activity", {
      p_activity_type: "achievement_unlocked",
      p_points: null,
      p_metadata: {
        achievementId: "abitudinario",
        achievementName: "Abitudinario",
      },
      p_dedup_key: "team-a:team-b:user-1:achievement:abitudinario",
      p_team_ids: ["team-a", "team-b"],
    });
  });

  it("dedup key diversa tra teamIds diversi", async () => {
    mockRpc();

    await createAchievementTeamActivities(
      achievements.slice(0, 1),
      ["team-a"],
      "user-1",
    );
    await createAchievementTeamActivities(
      achievements.slice(0, 1),
      ["team-a", "team-b"],
      "user-1",
    );

    const dedupKeys = supabase.rpc.mock.calls.map(
      (call) => call[1].p_dedup_key,
    );

    expect(dedupKeys[0]).toBe("team-a:user-1:achievement:prima-cacca");
    expect(dedupKeys[1]).toBe(
      "team-a:team-b:user-1:achievement:prima-cacca",
    );
    expect(dedupKeys[0]).not.toBe(dedupKeys[1]);
  });

  it("non propaga il fallimento di una singola activity", async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "errore" },
    });
    supabase.rpc.mockResolvedValueOnce({ data: null, error: null });

    const results = await createAchievementTeamActivities(
      achievements,
      ["team-a"],
      "user-1",
    );

    expect(results[0].status).toBe("rejected");
    expect(results[1].status).toBe("fulfilled");
  });
});