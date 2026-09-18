// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useAchievements } from "./useAchievements";

describe("useAchievements", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("restituisce i nuovi achievement sbloccati dai progressi", () => {
    const { result } = renderHook(() => useAchievements());

    let newAchievements;
    act(() => {
      newAchievements = result.current.checkAchievements(10, 0);
    });

    expect(newAchievements.map((achievement) => achievement.id)).toEqual([
      "prima-cacca",
      "abitudinario",
    ]);
  });

  it("non restituisce achievement senza progressi sufficienti", () => {
    const { result } = renderHook(() => useAchievements());

    let newAchievements;
    act(() => {
      newAchievements = result.current.checkAchievements(0, 0);
    });

    expect(newAchievements).toEqual([]);
  });

  it("un achievement già mostrato non viene restituito di nuovo", () => {
    const { result } = renderHook(() => useAchievements());

    let firstCall;
    let secondCall;
    act(() => {
      firstCall = result.current.checkAchievements(10, 0);
      secondCall = result.current.checkAchievements(10, 0);
    });

    expect(firstCall).toHaveLength(2);
    expect(secondCall).toEqual([]);
  });

  it("non registra duplicati negli achievement mostrati", () => {
    const { result } = renderHook(() => useAchievements());

    act(() => {
      result.current.checkAchievements(10, 0);
    });

    const shownAchievements = JSON.parse(
      localStorage.getItem("shownAchievements"),
    );

    expect(shownAchievements).toEqual(["prima-cacca", "abitudinario"]);
  });
});