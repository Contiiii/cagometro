// @vitest-environment jsdom
import { useEffect } from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import {
  getMyTeam,
  getTeamMembers,
  getTeamLeaderboard,
  getTeamActivity,
} from "../services/teamService";
import { TeamProvider } from "./TeamProvider";
import { useTeam } from "../hooks/useTeam";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

vi.mock("../services/teamService", () => ({
  getMyTeam: vi.fn(),
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
};

const TEAM_B = {
  team_id: "team-b",
  team_name: "Squadra B",
  role: "member",
  invite_code: "CCC-DDD",
  invites_enabled: true,
};

const MEMBERS = [{ user_id: "u-a", display_name: "Alice", role: "owner" }];
const LEADERBOARD = [{ user_id: "u-a", weekly_total: 10, lifetime_total: 100 }];
const ACTIVITY = [{ id: "act-1", activity_type: "entry_created", points: 1 }];

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createChannelMock() {
  const state = { channel: null, filter: null, onEvent: null, name: null };
  let current = null;

  supabase.channel.mockImplementation((name) => {
    state.name = name;
    current = {
      on: vi.fn((event, filter, callback) => {
        state.filter = filter;
        state.onEvent = callback;
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

async function loadTeam() {
  render(
    <TeamProvider>
      <Probe />
    </TeamProvider>,
  );

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

  useAuth.mockReturnValue({ user: null, loading: false });

  getTeamMembers.mockResolvedValue(MEMBERS);
  getTeamLeaderboard.mockResolvedValue(LEADERBOARD);
  getTeamActivity.mockResolvedValue(ACTIVITY);

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

describe("TeamProvider", () => {
  it("T1: con squadra esegue le RPC secondarie in parallelo e popola lo stato", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeam.mockResolvedValue(TEAM_A);

    await loadTeam();

    expect(getMyTeam).toHaveBeenCalledTimes(1);
    expect(getTeamMembers).toHaveBeenCalledTimes(1);
    expect(getTeamLeaderboard).toHaveBeenCalledTimes(1);
    expect(getTeamActivity).toHaveBeenCalledTimes(1);
    expect(latest.team).toEqual(TEAM_A);
    expect(latest.members).toEqual(MEMBERS);
    expect(latest.leaderboard).toEqual(LEADERBOARD);
    expect(latest.activity).toEqual(ACTIVITY);
    expect(latest.loading).toBe(false);
  });

  it("T2: senza squadra non esegue le RPC secondarie", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeam.mockResolvedValue(null);

    render(
      <TeamProvider>
        <Probe />
      </TeamProvider>,
    );

    await waitFor(() => {
      expect(latest.loading).toBe(false);
    });

    expect(getTeamMembers).not.toHaveBeenCalled();
    expect(getTeamLeaderboard).not.toHaveBeenCalled();
    expect(getTeamActivity).not.toHaveBeenCalled();
    expect(latest.team).toBeNull();
    expect(latest.members).toEqual([]);
    expect(latest.leaderboard).toEqual([]);
    expect(latest.activity).toEqual([]);
  });

  it("T3: errore parziale => sezioni fallite azzerate e hasErrors/failedSections", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeam.mockResolvedValue(TEAM_A);
    getTeamLeaderboard.mockRejectedValue(new Error("classifica ko"));
    getTeamActivity.mockRejectedValue(new Error("attività ko"));

    await loadTeam();

    console.error.mockClear();

    let result;
    await act(async () => {
      result = await latest.refreshDashboard();
    });

    expect(result).toEqual({
      hasErrors: true,
      failedSections: ["leaderboard", "activity"],
    });

    await waitFor(() => {
      expect(latest.members).toEqual(MEMBERS);
    });
    expect(latest.leaderboard).toEqual([]);
    expect(latest.activity).toEqual([]);

    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it("T4: getMyTeam fallisce => refreshDashboard lancia e azzera lo stato", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeam.mockRejectedValue(new Error("rete ko"));

    render(
      <TeamProvider>
        <Probe />
      </TeamProvider>,
    );

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

  it("T5: refreshTeam obsoleto non sovrascrive una dashboard più recente", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeam.mockResolvedValue(TEAM_A);

    await loadTeam();

    const staleTeam = deferred();
    getMyTeam.mockReturnValueOnce(staleTeam.promise);

    await act(async () => {
      latest.refreshTeam();
    });

    getMyTeam.mockResolvedValue(TEAM_B);

    await act(async () => {
      await latest.refreshDashboard();
    });

    await waitFor(() => {
      expect(latest.team?.team_id).toBe("team-b");
    });

    await act(async () => {
      staleTeam.resolve(TEAM_A);
    });

    expect(latest.team?.team_id).toBe("team-b");
  });

  it("T6: refreshDashboard vecchia non sovrascrive né disattiva loading", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeam.mockResolvedValue(TEAM_A);

    await loadTeam();

    const older = deferred();
    const newer = deferred();
    getMyTeam
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);

    let pOlder;
    let pNewer;
    await act(async () => {
      pOlder = latest.refreshDashboard();
    });
    await act(async () => {
      pNewer = latest.refreshDashboard();
    });

    await act(async () => {
      newer.resolve(TEAM_B);
      await pNewer;
    });

    await waitFor(() => {
      expect(latest.team?.team_id).toBe("team-b");
    });

    await act(async () => {
      older.resolve(TEAM_A);
      await pOlder;
    });

    expect(latest.team?.team_id).toBe("team-b");
    expect(latest.loading).toBe(false);
  });

  it("T7: cambio account non espone dati del precedente utente", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeam.mockResolvedValue(TEAM_A);

    const { rerender } = render(
      <TeamProvider>
        <Probe />
      </TeamProvider>,
    );

    await waitFor(() => {
      expect(latest.team?.team_id).toBe("team-a");
      expect(latest.loading).toBe(false);
    });

    const staleA = deferred();
    getMyTeam.mockReturnValueOnce(staleA.promise);

    let stalePromise;
    await act(async () => {
      stalePromise = latest.refreshTeam();
    });

    const loadB = deferred();
    getMyTeam.mockReturnValueOnce(loadB.promise);

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

    await act(async () => {
      loadB.resolve(TEAM_B);
    });

    await waitFor(() => {
      expect(latest.team?.team_id).toBe("team-b");
      expect(latest.loading).toBe(false);
    });

    await act(async () => {
      staleA.resolve(TEAM_A);
      await stalePromise;
    });

    expect(latest.team?.team_id).toBe("team-b");
  });

  it("T8: realtime usa filtro team_id e aggiorna membri solo su eventi membro", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeam.mockResolvedValue(TEAM_A);

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
      await realtime.onEvent({ new: { activity_type: "member_joined" } });
    });

    expect(getTeamMembers).toHaveBeenCalledTimes(1);
    expect(getTeamActivity).toHaveBeenCalledTimes(1);
    expect(getTeamLeaderboard).toHaveBeenCalledTimes(1);

    getTeamMembers.mockClear();

    await act(async () => {
      await realtime.onEvent({ new: { activity_type: "entry_created" } });
    });

    expect(getTeamMembers).not.toHaveBeenCalled();

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(realtime.channel);
  });

  it("T8b: realtime gestisce gli errori senza rejection non gestite", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeam.mockResolvedValue(TEAM_A);

    const realtime = createChannelMock();

    render(
      <TeamProvider>
        <Probe />
      </TeamProvider>,
    );

    await waitFor(() => {
      expect(realtime.filter).toBeTruthy();
    });

    getTeamMembers.mockRejectedValue(new Error("membri ko"));

    await act(async () => {
      await realtime.onEvent({ new: { activity_type: "member_joined" } });
    });

    expect(console.error).toHaveBeenCalledWith(
      "Errore aggiornamento realtime Team:",
      expect.any(Error),
    );
  });

  it("T8c: nessun canale se l'utente non ha squadra", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeam.mockResolvedValue(null);

    render(
      <TeamProvider>
        <Probe />
      </TeamProvider>,
    );

    await waitFor(() => {
      expect(latest.loading).toBe(false);
    });

    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it("T8d: nessun canale senza utente autenticato", async () => {
    useAuth.mockReturnValue({ user: null, loading: false });

    render(
      <TeamProvider>
        <Probe />
      </TeamProvider>,
    );

    await settleInitialLoad();

    expect(getMyTeam).not.toHaveBeenCalled();
    expect(supabase.channel).not.toHaveBeenCalled();
    expect(latest.loading).toBe(false);
  });

  it("T9: refreshDashboard() senza argomenti usa l'utente corrente", async () => {
    useAuth.mockReturnValue({ user: { id: "u-a" }, loading: false });
    getMyTeam.mockResolvedValue(TEAM_A);

    render(
      <TeamProvider>
        <Probe />
      </TeamProvider>,
    );

    await waitFor(() => {
      expect(latest.team?.team_id).toBe("team-a");
    });

    getMyTeam.mockClear();

    let result;
    await act(async () => {
      result = await latest.refreshDashboard();
    });

    expect(result).toEqual({ hasErrors: false, failedSections: [] });
    expect(getMyTeam).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(latest.loading).toBe(false);
    });
    expect(latest.team?.team_id).toBe("team-a");
  });

  it("T9b: refreshDashboard() senza utente non esegue alcuna RPC", async () => {
    useAuth.mockReturnValue({ user: null, loading: false });

    render(
      <TeamProvider>
        <Probe />
      </TeamProvider>,
    );

    await settleInitialLoad();

    let result;
    await act(async () => {
      result = await latest.refreshDashboard();
    });

    expect(result).toEqual({ hasErrors: false, failedSections: [] });
    expect(getMyTeam).not.toHaveBeenCalled();
  });
});