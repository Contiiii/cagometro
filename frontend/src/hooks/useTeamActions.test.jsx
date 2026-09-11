// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as teamService from "../services/teamService";
import { useTeamActions } from "./useTeamActions";

vi.mock("./useAuth", () => ({
  useAuth: () => ({ user: { id: "u-owner" } }),
}));

vi.mock("../services/teamService", () => ({
  createTeam: vi.fn(),
  joinTeam: vi.fn(),
  leaveTeam: vi.fn(),
  createTeamActivity: vi.fn(),
  transferOwnership: vi.fn(),
  removeTeamMember: vi.fn(),
  regenerateInviteCode: vi.fn(),
  toggleTeamInvites: vi.fn(),
  updateTeam: vi.fn(),
}));

const TEAM = {
  team_id: "team-a",
  team_name: "Squadra A",
  role: "owner",
  invite_code: "AAA-BBB",
  invites_enabled: true,
};

function createHarness(overrides = {}) {
  const notify = vi.fn();
  const refreshDashboard = vi
    .fn()
    .mockResolvedValue({ hasErrors: false, failedSections: [] });
  const refreshTeam = vi.fn().mockResolvedValue({});
  const refreshMembers = vi.fn().mockResolvedValue([]);
  const refreshLeaderboard = vi.fn().mockResolvedValue([]);
  const refreshActivity = vi.fn().mockResolvedValue([]);
  const setSelectedMember = vi.fn();

  const props = {
    team: TEAM,
    isLastMember: false,
    selectedMember: null,
    setSelectedMember,
    notify,
    refreshDashboard,
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
    refreshActivity,
    ...overrides,
  };

  const { result } = renderHook(
    (next) => useTeamActions(next || props),
    { initialProps: props },
  );

  return { result, props, notify, setSelectedMember };
}

async function runConfirm(result) {
  const onConfirm = result.current.confirm.config.onConfirm;

  await act(async () => {
    await onConfirm();
  });
}

function countErrorNotifies(notify) {
  return notify.mock.calls.filter(([, variant]) => variant === "error").length;
}

describe("useTeamActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    teamService.createTeam.mockResolvedValue({});
    teamService.joinTeam.mockResolvedValue(undefined);
    teamService.leaveTeam.mockResolvedValue(undefined);
    teamService.createTeamActivity.mockResolvedValue(undefined);
    teamService.transferOwnership.mockResolvedValue(undefined);
    teamService.removeTeamMember.mockResolvedValue(undefined);
    teamService.regenerateInviteCode.mockResolvedValue({ code: "NEW-CODE" });
    teamService.toggleTeamInvites.mockResolvedValue(undefined);
    teamService.updateTeam.mockResolvedValue(undefined);

    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("T1: create riuscita con refresh riusciti", async () => {
    const { result, props, notify } = createHarness();

    await act(async () => {
      await result.current.handleCreateTeam({
        name: "Comp",
        description: "desc",
      });
    });

    expect(teamService.createTeam).toHaveBeenCalledWith({
      name: "Comp",
      description: "desc",
      avatarEmoji: "🏆",
    });
    expect(props.refreshTeam).toHaveBeenCalledTimes(1);
    expect(props.refreshMembers).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith("Squadra creata", "success");
    expect(countErrorNotifies(notify)).toBe(0);
  });

  it("T2: create riuscita ma refresh fallito => successo parziale", async () => {
    const { result, props, notify } = createHarness();

    props.refreshMembers.mockRejectedValue(new Error("nope"));

    await act(async () => {
      await result.current.handleCreateTeam({
        name: "Comp",
        description: null,
      });
    });

    expect(teamService.createTeam).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(
      "Squadra creata, ma alcuni dati non sono stati aggiornati",
      "error",
    );
    expect(notify).not.toHaveBeenCalledWith(
      "Non è stato possibile creare la squadra",
      "error",
    );
  });

  it("T3: create fallita => l'errore viene rilanciato e nessun refresh parte", async () => {
    teamService.createTeam.mockRejectedValue(new Error("creazione fallita"));

    const { result, props, notify } = createHarness();

    await expect(
      act(async () => {
        await result.current.handleCreateTeam({
          name: "Comp",
          description: "desc",
        });
      }),
    ).rejects.toThrow("creazione fallita");

    expect(notify).toHaveBeenCalledWith("creazione fallita", "error");
    expect(props.refreshTeam).not.toHaveBeenCalled();
    expect(props.refreshMembers).not.toHaveBeenCalled();
  });

  it("T4: join riuscito con activity log fallito => l'ingresso resta valido", async () => {
    teamService.joinTeam.mockResolvedValue(undefined);
    teamService.createTeamActivity.mockRejectedValue(new Error("log"));

    const { result, props, notify } = createHarness();

    await act(async () => {
      await result.current.handleJoinTeam("CODE");
    });

    expect(teamService.joinTeam).toHaveBeenCalledWith("CODE");
    expect(teamService.createTeamActivity).toHaveBeenCalledWith(
      "member_joined",
    );
    expect(props.refreshDashboard).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith("Sei entrato nella squadra");
    expect(countErrorNotifies(notify)).toBe(0);
  });

  it("T5: join riuscito con refreshDashboard parziale => successo parziale", async () => {
    teamService.joinTeam.mockResolvedValue(undefined);

    const { result, props, notify } = createHarness();

    props.refreshDashboard.mockResolvedValue({
      hasErrors: true,
      failedSections: ["members"],
    });

    await act(async () => {
      await result.current.handleJoinTeam("CODE");
    });

    expect(notify).toHaveBeenCalledWith("Sei entrato nella squadra");
    expect(notify).toHaveBeenCalledWith(
      "Ingresso riuscito, ma alcuni dati non sono stati aggiornati",
      "error",
    );
  });

  it("T6: join fallito => l'errore viene rilanciato senza notifiche", async () => {
    teamService.joinTeam.mockRejectedValue(new Error("codice non valido"));

    const { result, props, notify } = createHarness();

    await expect(
      act(async () => {
        await result.current.handleJoinTeam("BAD");
      }),
    ).rejects.toThrow("codice non valido");

    expect(notify).not.toHaveBeenCalled();
    expect(teamService.createTeamActivity).not.toHaveBeenCalled();
    expect(props.refreshDashboard).not.toHaveBeenCalled();
  });

  it("T7: leave riuscita con log member_left fallito", async () => {
    teamService.leaveTeam.mockResolvedValue(undefined);
    teamService.createTeamActivity.mockRejectedValue(new Error("log"));

    const { result, props, notify, setSelectedMember } = createHarness();

    act(() => {
      result.current.handleLeaveTeam();
    });

    expect(result.current.confirm.config.type).toBe("leave-team");

    await runConfirm(result);

    expect(teamService.leaveTeam).toHaveBeenCalledTimes(1);
    expect(setSelectedMember).toHaveBeenCalledWith(null);
    expect(props.refreshDashboard).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith("Hai lasciato la squadra");
  });

  it("T8: leave fallita => errore fatale senza successo e senza refresh", async () => {
    teamService.leaveTeam.mockRejectedValue(new Error("uscita fallita"));

    const { result, props, notify } = createHarness();

    act(() => {
      result.current.handleLeaveTeam();
    });

    await expect(
      act(async () => {
        await result.current.confirm.config.onConfirm();
      }),
    ).rejects.toThrow("uscita fallita");

    expect(notify).not.toHaveBeenCalledWith("Hai lasciato la squadra");
    expect(props.refreshDashboard).not.toHaveBeenCalled();
    expect(result.current.leaving).toBe(false);
  });

  it("T9: remove riuscita con refresh parziale => successo parziale", async () => {
    const member = { user_id: "u-x", display_name: "X" };

    const { result, props, notify, setSelectedMember } = createHarness({
      selectedMember: "u-x",
    });

    props.refreshLeaderboard.mockRejectedValue(new Error("lb"));

    act(() => {
      result.current.handleRemoveMember(member);
    });

    expect(result.current.confirm.config.type).toBe("remove-member");

    await runConfirm(result);

    expect(teamService.removeTeamMember).toHaveBeenCalledWith("u-x");
    expect(teamService.createTeamActivity).toHaveBeenCalledWith(
      "member_removed",
      null,
      { target_user_id: "u-x", target_display_name: "X" },
    );
    expect(props.refreshMembers).toHaveBeenCalledTimes(1);
    expect(props.refreshLeaderboard).toHaveBeenCalledTimes(1);
    expect(props.refreshActivity).toHaveBeenCalledTimes(1);
    expect(setSelectedMember).toHaveBeenCalledWith(null);
    expect(notify).toHaveBeenCalledWith(
      "X è stato rimosso, ma alcuni dati non sono stati aggiornati",
      "error",
    );
  });

  it("T10: transfer riuscito con activity log fallito => successo", async () => {
    const member = { user_id: "u-x", display_name: "X", role: "member" };

    teamService.createTeamActivity.mockRejectedValue(new Error("log"));

    const { result, props, notify } = createHarness();

    act(() => {
      result.current.handleTransferOwnership(member);
    });

    expect(result.current.confirm.config.type).toBe("transfer-ownership");

    await runConfirm(result);

    expect(teamService.transferOwnership).toHaveBeenCalledWith("u-x");
    expect(props.refreshTeam).toHaveBeenCalledTimes(1);
    expect(props.refreshMembers).toHaveBeenCalledTimes(1);
    expect(props.refreshActivity).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith("X è ora il proprietario", "success");
  });

  it("T11: regenerate bloccata dal rate limit conserva l'errore", async () => {
    teamService.regenerateInviteCode.mockRejectedValue(
      new Error("Attendi 30 secondi prima di rigenerare il codice."),
    );

    const { result, props } = createHarness();

    act(() => {
      result.current.handleRegenerateInvite();
    });

    expect(result.current.confirm.config.type).toBe("regenerate-invite");

    await expect(
      act(async () => {
        await result.current.confirm.config.onConfirm();
      }),
    ).rejects.toThrow("Attendi 30 secondi");

    expect(props.refreshTeam).not.toHaveBeenCalled();
  });

  it("T12: regenerate riuscita ma refreshTeam fallito => successo parziale", async () => {
    const { result, props, notify } = createHarness();

    props.refreshTeam.mockRejectedValue(new Error("stale"));

    act(() => {
      result.current.handleRegenerateInvite();
    });

    await runConfirm(result);

    expect(teamService.regenerateInviteCode).toHaveBeenCalledTimes(1);
    expect(props.refreshTeam).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(
      "Codice rigenerato. Ricarica la pagina per aggiornare i dati.",
      "error",
    );
    expect(teamService.regenerateInviteCode).toHaveBeenCalledTimes(1);
  });

  it("T13: toggle primaria fallita => rollback ottimistico senza refresh", async () => {
    const { result, props, notify } = createHarness();

    expect(result.current.invitesEnabled).toBe(true);

    teamService.toggleTeamInvites.mockRejectedValue(new Error("boom"));

    await act(async () => {
      await result.current.handleToggleInvites(false);
    });

    expect(result.current.invitesEnabled).toBe(true);
    expect(result.current.invitesToggling).toBe(false);
    expect(props.refreshTeam).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      "Non è stato possibile aggiornare lo stato degli inviti",
      "error",
    );
  });

  it("T14: toggle primaria riuscita ma refresh fallito => nessun rollback", async () => {
    const { result, props, notify } = createHarness();

    props.refreshTeam.mockRejectedValue(new Error("stale"));

    await act(async () => {
      await result.current.handleToggleInvites(false);
    });

    expect(result.current.invitesEnabled).toBe(false);
    expect(teamService.toggleTeamInvites).toHaveBeenCalledWith(false);
    expect(props.refreshTeam).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(
      "Inviti disabilitati, ma alcuni dati non sono stati aggiornati",
      "error",
    );
  });

  it("T15: refresh obsoleto non altera il risultato del flusso", async () => {
    teamService.joinTeam.mockResolvedValue(undefined);

    const { result, props, notify } = createHarness();

    props.refreshDashboard.mockResolvedValue({
      hasErrors: false,
      failedSections: [],
      cancelled: true,
    });

    await act(async () => {
      await result.current.handleJoinTeam("CODE");
    });

    expect(notify).toHaveBeenCalledWith("Sei entrato nella squadra");
    expect(countErrorNotifies(notify)).toBe(0);

    await act(async () => {
      await result.current.handleUpdateTeam({
        name: "Nuovo nome",
        description: "x",
        avatarEmoji: "🔥",
      });
    });

    expect(teamService.updateTeam).toHaveBeenCalledWith({
      name: "Nuovo nome",
      description: "x",
      avatarEmoji: "🔥",
    });
    expect(props.refreshTeam).toHaveBeenCalledTimes(1);
    expect(countErrorNotifies(notify)).toBe(0);
  });
});