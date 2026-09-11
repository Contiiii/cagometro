// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TEAM_WEEKLY_GOAL } from "../config/team";
import { useTeamDashboard } from "./useTeamDashboard";

const TEAM = {
  team_id: "team-a",
  team_name: "Squadra A",
  role: "owner",
  invite_code: "AAA-BBB",
  invites_enabled: true,
};

const MEMBERS = [
  { user_id: "u-owner", display_name: "Owner", role: "owner" },
  { user_id: "u-bea", display_name: "Bea", role: "member" },
  { user_id: "u-carlo", display_name: "Carlo", role: "member" },
  { user_id: "u-left", display_name: "Leo", role: "member", left_at: "2026-01-01" },
  { user_id: "u-removed", display_name: "Rosa", role: "member", removed_at: "2026-01-01" },
];

const LEADERBOARD = [
  { user_id: "u-owner", display_name: "Owner", weekly_total: 10, lifetime_total: 100 },
  { user_id: "u-bea", display_name: "Bea", weekly_total: 25, lifetime_total: 50 },
  { user_id: "u-carlo", display_name: "Carlo", weekly_total: 25, lifetime_total: 60 },
  { user_id: "u-dario", display_name: "Dario", weekly_total: 5, lifetime_total: 300 },
];

function renderDashboard(props) {
  return renderHook((next) => useTeamDashboard(next || props), {
    initialProps: props,
  });
}

describe("useTeamDashboard", () => {
  it("calcola totali settimanali e storici dal leaderboard", () => {
    const { result } = renderDashboard({
      team: TEAM,
      members: MEMBERS,
      leaderboard: LEADERBOARD,
      user: null,
      rankingMode: "week",
    });

    expect(result.current.totalWeekly).toBe(65);
    expect(result.current.totalLifetime).toBe(510);
  });

  it("espone il goal settimanale centralizzato", () => {
    const { result } = renderDashboard({
      team: TEAM,
      members: MEMBERS,
      leaderboard: LEADERBOARD,
      user: null,
      rankingMode: "week",
    });

    expect(result.current.weeklyGoal).toBe(TEAM_WEEKLY_GOAL);
    expect(TEAM_WEEKLY_GOAL).toBe(140);
  });

  it("classifica in modalità settimana per punti decrescenti con pareggio alfabetico", () => {
    const { result } = renderDashboard({
      team: TEAM,
      members: MEMBERS,
      leaderboard: LEADERBOARD,
      user: null,
      rankingMode: "week",
    });

    expect(result.current.ranking.map((m) => m.user_id)).toEqual([
      "u-bea",
      "u-carlo",
      "u-owner",
      "u-dario",
    ]);
  });

  it("classifica in modalità storica (all) usando i totali lifetime", () => {
    const { result } = renderDashboard({
      team: TEAM,
      members: MEMBERS,
      leaderboard: LEADERBOARD,
      user: null,
      rankingMode: "all",
    });

    expect(result.current.ranking.map((m) => m.user_id)).toEqual([
      "u-dario",
      "u-owner",
      "u-carlo",
      "u-bea",
    ]);
  });

  it("calcola la posizione dell'utente corrente nella modalità attiva", () => {
    const { result, rerender } = renderDashboard({
      team: TEAM,
      members: MEMBERS,
      leaderboard: LEADERBOARD,
      user: { id: "u-owner" },
      rankingMode: "week",
    });

    expect(result.current.currentUserPosition).toBe(3);

    rerender({
      team: TEAM,
      members: MEMBERS,
      leaderboard: LEADERBOARD,
      user: { id: "u-owner" },
      rankingMode: "all",
    });

    expect(result.current.currentUserPosition).toBe(2);
  });

  it("restituisce posizione nulla se l'utente non è in classifica", () => {
    const { result } = renderDashboard({
      team: TEAM,
      members: MEMBERS,
      leaderboard: LEADERBOARD,
      user: { id: "u-estraneo" },
      rankingMode: "week",
    });

    expect(result.current.currentUserPosition).toBeNull();
  });

  it("seleziona membro, posizione e membership corrispondenti", () => {
    const { result } = renderDashboard({
      team: TEAM,
      members: MEMBERS,
      leaderboard: LEADERBOARD,
      user: null,
      rankingMode: "week",
      selectedMember: "u-bea",
    });

    expect(result.current.selectedData).toEqual({
      user_id: "u-bea",
      display_name: "Bea",
      weekly_total: 25,
      lifetime_total: 50,
    });
    expect(result.current.selectedPosition).toBe(1);
    expect(result.current.selectedMembership).toEqual(MEMBERS[1]);
  });

  it("seleziona null-entries quando il membro non esiste", () => {
    const { result } = renderDashboard({
      team: TEAM,
      members: MEMBERS,
      leaderboard: LEADERBOARD,
      user: null,
      rankingMode: "week",
      selectedMember: null,
    });

    expect(result.current.selectedData).toBeNull();
    expect(result.current.selectedPosition).toBeNull();
    expect(result.current.selectedMembership).toBeNull();
  });

  it("filtra membri non attivi da activeMembers", () => {
    const { result } = renderDashboard({
      team: TEAM,
      members: MEMBERS,
      leaderboard: LEADERBOARD,
      user: null,
      rankingMode: "week",
    });

    expect(result.current.activeMembers.map((m) => m.user_id)).toEqual([
      "u-owner",
      "u-bea",
      "u-carlo",
    ]);
  });

  it("identifica proprietario e ultimo membro", () => {
    const owner = {
      team_id: "team-a",
      role: "owner",
      invite_code: "AAA-BBB",
    };

    const solo = renderHook((p) => useTeamDashboard(p), {
      initialProps: {
        team: owner,
        members: [{ user_id: "u-owner", role: "owner" }],
        leaderboard: LEADERBOARD,
        user: null,
        rankingMode: "week",
      },
    });

    expect(solo.result.current.isOwner).toBe(true);
    expect(solo.result.current.isLastMember).toBe(true);

    const multi = renderHook((p) => useTeamDashboard(p), {
      initialProps: {
        team: owner,
        members: MEMBERS,
        leaderboard: LEADERBOARD,
        user: null,
        rankingMode: "week",
      },
    });

    expect(multi.result.current.isOwner).toBe(true);
    expect(multi.result.current.isLastMember).toBe(false);

    const member = renderHook((p) => useTeamDashboard(p), {
      initialProps: {
        team: { team_id: "team-a", role: "member", invite_code: "AAA-BBB" },
        members: [{ user_id: "u-alone", role: "member" }],
        leaderboard: LEADERBOARD,
        user: null,
        rankingMode: "week",
      },
    });

    expect(member.result.current.isOwner).toBe(false);
    expect(member.result.current.isLastMember).toBe(false);
  });

  it("espone il codice invito della squadra", () => {
    const { result } = renderDashboard({
      team: TEAM,
      members: MEMBERS,
      leaderboard: LEADERBOARD,
      user: null,
      rankingMode: "week",
    });

    expect(result.current.inviteCode).toBe("AAA-BBB");
  });

  it("applica default sicuri in assenza di dati", () => {
    const { result } = renderDashboard({
      team: null,
      members: null,
      leaderboard: null,
      user: null,
      rankingMode: "week",
    });

    expect(result.current.totalWeekly).toBe(0);
    expect(result.current.totalLifetime).toBe(0);
    expect(result.current.ranking).toEqual([]);
    expect(result.current.currentUserPosition).toBeNull();
    expect(result.current.activeMembers).toEqual([]);
    expect(result.current.isOwner).toBe(false);
    expect(result.current.isLastMember).toBe(false);
    expect(result.current.inviteCode).toBe("");
  });
});