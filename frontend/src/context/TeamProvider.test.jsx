// @vitest-environment jsdom
import { useEffect } from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../hooks/useAuth";
import { useSettings } from "../hooks/useSettings";
import { supabase } from "../lib/supabase";
import {
  getMyTeams,
  getTeam,
  getTeamMembers,
  getTeamLeaderboard,
  getTeamActivity,
} from "../services/teamService";
import { TeamProvider, TEAM_REALTIME_DEBOUNCE_MS } from "./TeamProvider";
import { useTeam } from "../hooks/useTeam";

import { saveTeamSnapshot } from "../utils/storage";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../hooks/useSettings", () => ({
  useSettings: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

vi.mock("../services/teamService", () => ({
  getMyTeams: vi.fn(),
  getTeam: vi.fn(),
  getTeamMembers: vi.fn(),
  getTeamLeaderboard: vi.fn(),
  getTeamActivity: vi.fn(),
}));

const TEAM_A = {
  team_id: "team-a",
  team_name: "Squadra A",
  role: "owner",
  invite_code: "AAA-BBB",
  invites_enabled: true,
  member_count: 3,
};

const TEAM_B = {
  team_id: "team-b",
  team_name: "Squadra B",
  role: "member",
  invite_code: "CCC-DDD",
  invites_enabled: true,
  member_count: 5,
};

const TEAM_C = {
  team_id: "team-c",
  team_name: "Squadra C",
  role: "member",
  invite_code: "EEE-FFF",
  invites_enabled: true,
  member_count: 2,
};

const MEMBERS_A = [{ user_id: "u-a", display_name: "Alice", role: "owner" }];
const LEADERBOARD_A = [
  { user_id: "u-a", weekly_total: 10, lifetime_total: 100 },
];
const ACTIVITY_A = [{ id: "act-1", activity_type: "entry_created", points: 1 }];

const MEMBERS_B = [{ user_id: "u-b", display_name: "Bob", role: "owner" }];
const LEADERBOARD_B = [
  { user_id: "u-b", weekly_total: 4, lifetime_total: 40 },
];
const ACTIVITY_B = [{ id: "act-2", activity_type: "entry_created", points: 1 }];

function createChannelMock() {
  const state = {
    channel: null,
    filter: null,
    onEvent: null,
    name: null,
    handlers: {},
  };
  let current = null;

  supabase.channel.mockImplementation((name) => {
    state.name = name;
    current = {
      on: vi.fn((event, filter, callback) => {
        const kind = filter?.event ?? event;

        if (!state.handlers[kind]) {
          state.handlers[kind] = [];
        }
        state.handlers[kind].push({ filter, callback });

        if (kind === "INSERT") {
          state.filter = filter;
          state.onEvent = callback;
        }
        return current;
      }),
      subscribe: vi.fn((callback) => {
        if (callback) {
          callback("SUBSCRIBED");
        }
        return current;
      }),
    };
    state.channel = current;
    return current;
  });

  return state;
}

let latest;
function Probe() {
  const value = useTeam();
  useEffect(() => {
    latest = value;
  });
  return null;
}

async function settleInitialLoad() {
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });
}

async function flushRealtimeDebounce() {
  await act(async () => {
    await new Promise((resolve) =>
      window.setTimeout(resolve, TEAM_REALTIME_DEBOUNCE_MS + 10),
    );
  });
}

async function renderProvider() {
  render(
    <TeamProvider>
      <Probe />
    </TeamProvider>,
  );
}

async function loadSingleTeam() {
  await renderProvider();

  await waitFor(() => {
    expect(latest.team?.team_id).toBe("team-a");
  });

  await waitFor(() => {
    expect(latest.loading).toBe(false);
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  latest = null;

  window.localStorage.clear();

  useAuth.mockReturnValue({ user: null, loading: false });

  useSettings.mockReturnValue({ initialTeamActivityLimit: 3 });

  getTeamMembers.mockResolvedValue(MEMBERS_A);
  getTeamLeaderboard.mockResolvedValue(LEADERBOARD_A);
  getTeamActivity.mockResolvedValue(ACTIVITY_A);

  supabase.channel.mockImplementation(() => {
    const channel = {
      on: vi.fn(function on() {
        return channel;
      }),
      subscribe: vi.fn(function subscribe(callback) {
        if (callback) {
          callback("SUBSCRIBED");
        }
        return channel;
      }),
    };
    return channel;
  });

  supabase.removeChannel.mockImplementation(() => undefined);

  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("TeamProvider multi-squadra", () => {
  it("M1: con una squadra popola stato e teamIdsRef", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeams.mockResolvedValue([TEAM_A]);
    getTeam.mockResolvedValue(TEAM_A);

    await loadSingleTeam();

    expect(getMyTeams).toHaveBeenCalledTimes(1);
    expect(getTeam).toHaveBeenCalledWith("team-a");
    expect(getTeamMembers).toHaveBeenCalledTimes(1);
    expect(getTeamLeaderboard).toHaveBeenCalledTimes(1);
    expect(getTeamActivity).toHaveBeenCalledTimes(1);
    expect(latest.team).toEqual(TEAM_A);
    expect(latest.teams).toEqual([TEAM_A]);
    expect(latest.members).toEqual(MEMBERS_A);
    expect(latest.leaderboard).toEqual(LEADERBOARD_A);
    expect(latest.activity).toEqual(ACTIVITY_A);
    expect(latest.viewedTeamId).toBe("team-a");
    expect(latest.atTeamLimit).toBe(false);
    expect(latest.loading).toBe(false);
    expect(latest.teamIdsRef.current).toEqual(["team-a"]);
  });

  it("M2: senza squadre nessuna RPC secondaria, atTeamLimit false", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeams.mockResolvedValue([]);

    await renderProvider();

    await waitFor(() => {
      expect(latest.loading).toBe(false);
    });

    expect(getTeam).not.toHaveBeenCalled();
    expect(getTeamMembers).not.toHaveBeenCalled();
    expect(getTeamLeaderboard).not.toHaveBeenCalled();
    expect(getTeamActivity).not.toHaveBeenCalled();
    expect(latest.team).toBeNull();
    expect(latest.teams).toEqual([]);
    expect(latest.members).toEqual([]);
    expect(latest.leaderboard).toEqual([]);
    expect(latest.activity).toEqual([]);
    expect(latest.atTeamLimit).toBe(false);
    expect(latest.teamIdsRef.current).toEqual([]);
  });

  it("M3: iscritto a 3 squadre => atTeamLimit true", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeams.mockResolvedValue([TEAM_A, TEAM_B, TEAM_C]);
    getTeam.mockResolvedValue(TEAM_A);

    await renderProvider();

    await waitFor(() => {
      expect(latest.loading).toBe(false);
    });

    expect(latest.teams).toHaveLength(3);
    expect(latest.atTeamLimit).toBe(true);
    expect(latest.teamIdsRef.current).toEqual([
      "team-a",
      "team-b",
      "team-c",
    ]);
  });

  it("M4: visualizza la prima squadra come default e selectTeam cambia bundle", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeams.mockResolvedValue([TEAM_A, TEAM_B]);
    getTeam
      .mockResolvedValueOnce(TEAM_A)
      .mockResolvedValueOnce(TEAM_B);
    getTeamMembers
      .mockResolvedValueOnce(MEMBERS_A)
      .mockResolvedValueOnce(MEMBERS_B);
    getTeamLeaderboard
      .mockResolvedValueOnce(LEADERBOARD_A)
      .mockResolvedValueOnce(LEADERBOARD_B);
    getTeamActivity
      .mockResolvedValueOnce(ACTIVITY_A)
      .mockResolvedValueOnce(ACTIVITY_B);

    await renderProvider();

    await waitFor(() => {
      expect(latest.team?.team_id).toBe("team-a");
    });
    expect(latest.teams).toHaveLength(2);
    expect(latest.viewedTeamId).toBe("team-a");

    await act(async () => {
      await latest.selectTeam("team-b");
    });

    await waitFor(() => {
      expect(latest.team?.team_id).toBe("team-b");
    });

    expect(getTeam).toHaveBeenLastCalledWith("team-b");
    expect(latest.members).toEqual(MEMBERS_B);
    expect(latest.leaderboard).toEqual(LEADERBOARD_B);
    expect(latest.activity).toEqual(ACTIVITY_B);
    expect(latest.viewedTeamId).toBe("team-b");
    expect(latest.teamIdsRef.current).toEqual(["team-a", "team-b"]);
  });

  it("M5: preferisce la squadra salvata come vista di default", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeams.mockResolvedValue([TEAM_A, TEAM_B]);
    getTeam.mockResolvedValue(TEAM_B);

    window.localStorage.setItem("team_viewed_u-a", "team-b");

    await renderProvider();

    await waitFor(() => {
      expect(latest.team?.team_id).toBe("team-b");
    });

    expect(getTeam).toHaveBeenCalledWith("team-b");
    expect(latest.viewedTeamId).toBe("team-b");
  });

  it("M5b: se la squadra salvata non è più nelle mie squadre ricade sulla prima", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeams.mockResolvedValue([TEAM_A, TEAM_B]);
    getTeam.mockResolvedValue(TEAM_A);

    window.localStorage.setItem("team_viewed_u-a", "team-uscita");

    await renderProvider();

    await waitFor(() => {
      expect(latest.team?.team_id).toBe("team-a");
    });

    expect(latest.viewedTeamId).toBe("team-a");
  });

  it("M6: errore parziale mantiene i dati delle sezioni fallite sulla stessa squadra", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeams.mockResolvedValue([TEAM_A]);
    getTeam.mockResolvedValue(TEAM_A);

    await loadSingleTeam();

    console.error.mockClear();

    getTeamLeaderboard.mockRejectedValue(new Error("classifica ko"));
    getTeamActivity.mockRejectedValue(new Error("attività ko"));

    let result;
    await act(async () => {
      result = await latest.refreshDashboard();
    });

    expect(result).toEqual({
      hasErrors: true,
      failedSections: ["leaderboard", "activity"],
    });

    await waitFor(() => {
      expect(latest.members).toEqual(MEMBERS_A);
    });
    expect(latest.leaderboard).toEqual(LEADERBOARD_A);
    expect(latest.activity).toEqual(ACTIVITY_A);
  });

  it("M7: cambio squadra con errore parziale azzera le sezioni fallite", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeams.mockResolvedValue([TEAM_A, TEAM_B]);
    getTeam.mockResolvedValue(TEAM_A);

    await renderProvider();

    await waitFor(() => {
      expect(latest.team?.team_id).toBe("team-a");
    });

    console.error.mockClear();

    getTeam.mockResolvedValue(TEAM_B);
    getTeamLeaderboard.mockRejectedValue(new Error("classifica ko"));
    getTeamActivity.mockRejectedValue(new Error("attività ko"));

    let result;
    await act(async () => {
      result = await latest.selectTeam("team-b");
    });

    expect(result).toEqual({
      hasErrors: true,
      failedSections: ["leaderboard", "activity"],
    });

    expect(latest.team?.team_id).toBe("team-b");
    expect(latest.leaderboard).toEqual([]);
    expect(latest.activity).toEqual([]);
  });

  it("M8: getMyTeams fallisce => refreshDashboard lancia e azzera lo stato", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeams.mockRejectedValue(new Error("rete ko"));

    await renderProvider();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(latest.loading).toBe(false);
    });

    expect(latest.team).toBeNull();
    expect(latest.members).toEqual([]);

    let threw = false;
    await act(async () => {
      try {
        await latest.refreshDashboard();
      } catch {
        threw = true;
      }
    });

    expect(threw).toBe(true);
  });

  it("M9: cambio account non espone i dati del precedente utente", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeams.mockResolvedValue([TEAM_A]);
    getTeam.mockResolvedValue(TEAM_A);

    const { rerender } = render(
      <TeamProvider>
        <Probe />
      </TeamProvider>,
    );

    await waitFor(() => {
      expect(latest.team?.team_id).toBe("team-a");
      expect(latest.loading).toBe(false);
    });

    getMyTeams.mockResolvedValue([TEAM_B]);
    getTeam.mockResolvedValue(TEAM_B);
    getTeamMembers.mockResolvedValue(MEMBERS_B);
    getTeamLeaderboard.mockResolvedValue(LEADERBOARD_B);
    getTeamActivity.mockResolvedValue(ACTIVITY_B);

    useAuth.mockReturnValue({ user: { id: "u-b" }, loading: false });

    await act(async () => {
      rerender(
        <TeamProvider>
          <Probe />
        </TeamProvider>,
      );
    });

    await waitFor(() => {
      expect(latest.team).toBeNull();
      expect(latest.members).toEqual([]);
      expect(latest.loading).toBe(true);
    });

    await waitFor(() => {
      expect(latest.team?.team_id).toBe("team-b");
      expect(latest.loading).toBe(false);
    });

    expect(latest.teams).toEqual([TEAM_B]);
  });

  it("M10: realtime usa il team visualizzato, coalesce e aggiorna i membri solo su eventi membro", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeams.mockResolvedValue([TEAM_A]);
    getTeam.mockResolvedValue(TEAM_A);

    const realtime = createChannelMock();

    const { unmount } = render(
      <TeamProvider>
        <Probe />
      </TeamProvider>,
    );

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith("team-activity-team-a");
    });

    expect(realtime.filter).toMatchObject({
      event: "INSERT",
      schema: "public",
      table: "team_activity",
      filter: "team_id=eq.team-a",
    });

    getTeamMembers.mockClear();
    getTeamActivity.mockClear();
    getTeamLeaderboard.mockClear();

    await act(async () => {
      await realtime.onEvent({ new: { activity_type: "entry_created" } });
      await realtime.onEvent({ new: { activity_type: "entry_created" } });
      await realtime.onEvent({ new: { activity_type: "entry_created" } });
    });

    await flushRealtimeDebounce();

    expect(getTeamMembers).not.toHaveBeenCalled();
    expect(getTeamActivity).toHaveBeenCalledTimes(1);
    expect(getTeamLeaderboard).toHaveBeenCalledTimes(1);

    getTeamMembers.mockClear();
    getTeamActivity.mockClear();
    getTeamLeaderboard.mockClear();

    await act(async () => {
      await realtime.onEvent({ new: { activity_type: "member_joined" } });
    });

    await flushRealtimeDebounce();

    expect(getTeamMembers).toHaveBeenCalledTimes(1);
    expect(getTeamActivity).toHaveBeenCalledTimes(1);
    expect(getTeamLeaderboard).toHaveBeenCalledTimes(1);

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(realtime.channel);
  });

  it("M11: nessun canale realtime senza squadre o senza utente", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeams.mockResolvedValue([]);

    await renderProvider();

    await waitFor(() => {
      expect(latest.loading).toBe(false);
    });

    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it("M12: refreshDashboard() senza argomenti usa l'utente corrente", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeams.mockResolvedValue([TEAM_A]);
    getTeam.mockResolvedValue(TEAM_A);

    await renderProvider();

    await waitFor(() => {
      expect(latest.team?.team_id).toBe("team-a");
    });

    getMyTeams.mockClear();
    getTeam.mockClear();

    let result;
    await act(async () => {
      result = await latest.refreshDashboard();
    });

    expect(result).toEqual({ hasErrors: false, failedSections: [] });
    expect(getMyTeams).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(latest.loading).toBe(false);
    });
    expect(latest.team?.team_id).toBe("team-a");
  });

  it("M13: refreshDashboard() senza utente non esegue alcuna RPC", async () => {
    useAuth.mockReturnValue({ user: null, loading: false });

    await renderProvider();

    await settleInitialLoad();

    let result;
    await act(async () => {
      result = await latest.refreshDashboard();
    });

    expect(result).toEqual({ hasErrors: false, failedSections: [] });
    expect(getMyTeams).not.toHaveBeenCalled();
  });

  describe("snapshot offline", () => {
    it("S1: salva lo snapshot (teams + bundle) dopo il refresh", async () => {
      useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
      getMyTeams.mockResolvedValue([TEAM_A, TEAM_B]);
      getTeam.mockResolvedValue(TEAM_A);

      await loadSingleTeam();

      const stored = JSON.parse(
        window.localStorage.getItem("team_snapshot_u-a"),
      );

      expect(stored.timestamp).toBeDefined();
      expect(stored.data.teams).toEqual([TEAM_A, TEAM_B]);
      expect(stored.data.viewedTeamId).toBe("team-a");
      expect(stored.data.team).toEqual(TEAM_A);
      expect(stored.data.members).toEqual(MEMBERS_A);
      expect(stored.data.leaderboard).toEqual(LEADERBOARD_A);
      expect(stored.data.activity).toEqual(ACTIVITY_A);
    });

    it("S2: senza squadre non salva lo snapshot", async () => {
      useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
      getMyTeams.mockResolvedValue([]);

      await renderProvider();

      await waitFor(() => {
        expect(latest.loading).toBe(false);
      });

      expect(window.localStorage.getItem("team_snapshot_u-a")).toBeNull();
    });

    it("S3: con snapshot in cache le squadre vengono esposte subito all'avvio", async () => {
      saveTeamSnapshot("u-a", {
        teams: [TEAM_A, TEAM_B],
        viewedTeamId: "team-b",
        team: TEAM_B,
        members: MEMBERS_B,
        leaderboard: LEADERBOARD_B,
        activity: ACTIVITY_B,
      });

      getMyTeams.mockResolvedValue([TEAM_A, TEAM_B]);
      getTeam.mockResolvedValue(TEAM_B);

      useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });

      await renderProvider();

      await waitFor(() => {
        expect(latest.teams).toHaveLength(2);
      });

      expect(latest.viewedTeamId).toBe("team-b");
      expect(getMyTeams).toHaveBeenCalledTimes(1);
      expect(getTeam).toHaveBeenCalledTimes(1);
    });

    it("S4: se getMyTeams/refresh fallisce lo snapshot in cache viene mantenuto", async () => {
      saveTeamSnapshot("u-a", {
        teams: [TEAM_A],
        viewedTeamId: "team-a",
        team: TEAM_A,
        members: MEMBERS_A,
        leaderboard: LEADERBOARD_A,
        activity: ACTIVITY_A,
      });

      getMyTeams.mockRejectedValue(new Error("offline"));

      useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });

      await renderProvider();

      await waitFor(() => {
        expect(latest.loading).toBe(false);
      });

      expect(latest.team).toEqual(TEAM_A);
      expect(latest.teams).toEqual([TEAM_A]);
      expect(latest.teamIdsRef.current).toEqual(["team-a"]);
      expect(latest.members).toEqual(MEMBERS_A);
      expect(latest.leaderboard).toEqual(LEADERBOARD_A);
      expect(latest.activity).toEqual(ACTIVITY_A);
    });
  });
});