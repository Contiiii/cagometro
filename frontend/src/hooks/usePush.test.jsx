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
  getMyPushSubscriptions: vi.fn(),
  removePushSubscription: vi.fn(),
  refreshPushSubscription: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();

  pushService.getNotificationPermission.mockReturnValue("default");
  pushService.getMyPushSubscriptions.mockResolvedValue([]);
  pushService.refreshPushSubscription.mockResolvedValue(undefined);
  pushService.removePushSubscription.mockResolvedValue(undefined);
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

  it("carica i dispositivi registrati", async () => {
    pushService.getPushSubscription.mockResolvedValue(null);
    pushService.getMyPushSubscriptions.mockResolvedValue([
      { endpoint: "endpoint-1", device_name: "Chrome su Windows" },
    ]);

    const { result } = renderHook(() => usePush());

    await waitFor(() => {
      expect(result.current.devices).toHaveLength(1);
    });
  });

  it("rinfresca last_seen_at quando il permesso è concesso", async () => {
    pushService.getNotificationPermission.mockReturnValue("granted");
    pushService.getPushSubscription.mockResolvedValue({
      endpoint: "endpoint-1",
    });

    renderHook(() => usePush());

    await waitFor(() => {
      expect(pushService.refreshPushSubscription).toHaveBeenCalled();
    });
  });

  it("non rinfresca senza permesso concesso", async () => {
    pushService.getNotificationPermission.mockReturnValue("default");
    pushService.getPushSubscription.mockResolvedValue({
      endpoint: "endpoint-1",
    });

    const { result } = renderHook(() => usePush());

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true);
    });

    expect(pushService.refreshPushSubscription).not.toHaveBeenCalled();
  });

  it("removeDevice rimuove il dispositivo e ricarica la lista", async () => {
    pushService.getPushSubscription.mockResolvedValue(null);

    const { result } = renderHook(() => usePush());

    await act(async () => {
      await result.current.removeDevice("endpoint-2");
    });

    expect(pushService.removePushSubscription).toHaveBeenCalledWith("endpoint-2");
    expect(pushService.getMyPushSubscriptions).toHaveBeenCalled();
  });
});