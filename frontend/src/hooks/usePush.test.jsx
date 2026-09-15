// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as pushService from "../services/pushService";
import { usePush } from "./usePush";

vi.mock("./useAuth", () => ({
  useAuth: () => ({ user: { id: "u-1" } }),
}));

vi.mock("../services/pushService", () => ({
  getNotificationPermission: vi.fn(() => "default"),
  getPushSubscription: vi.fn(),
  isPushSupported: vi.fn(() => true),
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePush", () => {
  it("rileva lo stato di sottoscrizione esistente", async () => {
    pushService.getPushSubscription.mockResolvedValue({
      endpoint: "endpoint-1",
    });

    const { result } = renderHook(() => usePush());

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true);
    });
  });

  it("rimane non sottoscritto senza subscription", async () => {
    pushService.getPushSubscription.mockResolvedValue(null);

    const { result } = renderHook(() => usePush());

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(false);
    });
  });

  it("subscribe aggiorna stato e permission", async () => {
    pushService.getPushSubscription.mockResolvedValue(null);
    pushService.subscribeToPush.mockResolvedValue({
      permission: "granted",
      subscription: { endpoint: "endpoint-1" },
    });

    const { result } = renderHook(() => usePush());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(pushService.subscribeToPush).toHaveBeenCalled();
    expect(result.current.permission).toBe("granted");
    expect(result.current.isSubscribed).toBe(true);
  });

  it("unsubscribe azzera lo stato di sottoscrizione", async () => {
    pushService.getPushSubscription.mockResolvedValue({
      endpoint: "endpoint-1",
    });

    const { result } = renderHook(() => usePush());

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true);
    });

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(pushService.unsubscribeFromPush).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(false);
  });
});