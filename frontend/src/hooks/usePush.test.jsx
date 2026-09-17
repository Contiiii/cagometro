// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as pushService from "../services/pushService";
import { reportError } from "../utils/reportError";
import { trackEvent } from "../services/analyticsService";
import { usePush } from "./usePush";

vi.mock("./useAuth", () => ({
  useAuth: () => ({ user: { id: "u-1" } }),
}));

vi.mock("../utils/reportError", () => ({
  reportError: vi.fn(),
}));

vi.mock("../services/analyticsService", () => ({
  trackEvent: vi.fn(),
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
  claimPushSubscription: vi.fn(),
  isPushSubscriptionOwnedByOther: vi.fn(() => false),
  sendMyPushNotification: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();

  pushService.getNotificationPermission.mockReturnValue("default");
  pushService.getMyPushSubscriptions.mockResolvedValue([]);
  pushService.refreshPushSubscription.mockResolvedValue(undefined);
  pushService.removePushSubscription.mockResolvedValue(undefined);
  pushService.sendMyPushNotification.mockResolvedValue(undefined);
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

  it("espone initialized al termine del sync iniziale", async () => {
    pushService.getPushSubscription.mockResolvedValue(null);

    const { result } = renderHook(() => usePush());

    expect(result.current.initialized).toBe(false);

    await waitFor(() => {
      expect(result.current.initialized).toBe(true);
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

  it("subscribe gestisce l'errore e imposta subscribeError", async () => {
    pushService.getPushSubscription.mockResolvedValue(null);
    pushService.subscribeToPush.mockRejectedValue(
      new Error("Service worker non disponibile"),
    );

    const { result } = renderHook(() => usePush());

    await act(async () => {
      const ret = await result.current.subscribe();
      expect(ret.error).toBe("Service worker non disponibile");
    });

    expect(result.current.subscribeError).toBe("Service worker non disponibile");
    expect(result.current.permission).toBe("default");
    expect(result.current.isSubscribed).toBe(false);
  });

  it("rileva il conflitto durante il mount senza adottare l'endpoint", async () => {
    pushService.getPushSubscription.mockResolvedValue({
      endpoint: "endpoint-1",
    });
    pushService.getNotificationPermission.mockReturnValue("granted");
    pushService.refreshPushSubscription.mockRejectedValue({
      code: "PUSH1",
      message: "PUSH_OWNED_BY_OTHER|Subscription already owned by another user",
    });
    pushService.isPushSubscriptionOwnedByOther.mockReturnValue(true);

    const { result } = renderHook(() => usePush());

    await waitFor(() => {
      expect(result.current.subscribeConflict).toBe(true);
    });

    expect(pushService.claimPushSubscription).not.toHaveBeenCalled();
    expect(reportError).not.toHaveBeenCalled();
  });

  it("subscribe in conflitto segnala il claim senza errore generico", async () => {
    pushService.getPushSubscription.mockResolvedValue(null);
    pushService.subscribeToPush.mockRejectedValue({
      code: "PUSH1",
      message: "PUSH_OWNED_BY_OTHER|Subscription already owned by another user",
    });
    pushService.isPushSubscriptionOwnedByOther.mockReturnValue(true);

    const { result } = renderHook(() => usePush());

    await act(async () => {
      const ret = await result.current.subscribe();

      expect(ret.conflict).toBe(true);
      expect(ret.error).toBeNull();
    });

    expect(result.current.subscribeConflict).toBe(true);
    expect(result.current.subscribeError).toBeNull();
    expect(reportError).not.toHaveBeenCalled();
  });

  it("claim riuscito aggiorna stato e dispositivi e chiude il conflitto", async () => {
    pushService.getPushSubscription.mockResolvedValue({
      endpoint: "endpoint-1",
    });
    pushService.getNotificationPermission.mockReturnValue("granted");
    pushService.refreshPushSubscription.mockRejectedValue({
      code: "PUSH1",
      message: "PUSH_OWNED_BY_OTHER|Subscription already owned by another user",
    });
    pushService.isPushSubscriptionOwnedByOther.mockReturnValue(true);
    pushService.claimPushSubscription.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePush());

    await waitFor(() => {
      expect(result.current.subscribeConflict).toBe(true);
    });

    await act(async () => {
      const ret = await result.current.claim();
      expect(ret.error).toBeNull();
    });

    expect(pushService.claimPushSubscription).toHaveBeenCalledTimes(1);
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.currentEndpoint).toBe("endpoint-1");
    expect(result.current.subscribeConflict).toBe(false);
    expect(pushService.getMyPushSubscriptions).toHaveBeenCalledTimes(2);
  });

  it("claim fallito lascia lo stato invariato e segnala l'errore", async () => {
    pushService.getPushSubscription.mockResolvedValue({
      endpoint: "endpoint-1",
    });
    pushService.getNotificationPermission.mockReturnValue("granted");
    pushService.refreshPushSubscription.mockRejectedValue({
      code: "PUSH1",
      message: "PUSH_OWNED_BY_OTHER|Subscription already owned by another user",
    });
    pushService.isPushSubscriptionOwnedByOther.mockReturnValue(true);
    pushService.claimPushSubscription.mockRejectedValue(
      new Error("rpc ko"),
    );

    const { result } = renderHook(() => usePush());

    await waitFor(() => {
      expect(result.current.subscribeConflict).toBe(true);
    });

    await act(async () => {
      const ret = await result.current.claim();
      expect(ret.error).toBe("rpc ko");
    });

    expect(result.current.subscribeConflict).toBe(true);
    expect(result.current.subscribeError).toBe("rpc ko");
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.currentEndpoint).toBe("endpoint-1");
    expect(pushService.getMyPushSubscriptions).toHaveBeenCalledTimes(1);
  });

  it("dismissConflict chiude il prompt senza chiamare claim", async () => {
    pushService.getPushSubscription.mockResolvedValue({
      endpoint: "endpoint-1",
    });
    pushService.getNotificationPermission.mockReturnValue("granted");
    pushService.refreshPushSubscription.mockRejectedValue({
      code: "PUSH1",
      message: "PUSH_OWNED_BY_OTHER|Subscription already owned by another user",
    });
    pushService.isPushSubscriptionOwnedByOther.mockReturnValue(true);

    const { result } = renderHook(() => usePush());

    await waitFor(() => {
      expect(result.current.subscribeConflict).toBe(true);
    });

    act(() => {
      result.current.dismissConflict();
    });

    expect(result.current.subscribeConflict).toBe(false);
    expect(pushService.claimPushSubscription).not.toHaveBeenCalled();
  });

  it("l'attivazione esplicita invia la push di test e traccia l'evento", async () => {
    pushService.getPushSubscription.mockResolvedValue(null);
    pushService.subscribeToPush.mockResolvedValue({
      permission: "granted",
      subscription: { endpoint: "endpoint-1" },
    });

    const { result } = renderHook(() => usePush());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(pushService.sendMyPushNotification).toHaveBeenCalledTimes(1);
    expect(pushService.sendMyPushNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: "test" }),
    );
    expect(trackEvent).toHaveBeenCalledWith("push_test_sent");
  });

  it("il mount non invia la push di test", async () => {
    pushService.getPushSubscription.mockResolvedValue({
      endpoint: "endpoint-1",
    });

    const { result } = renderHook(() => usePush());

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true);
    });

    expect(pushService.sendMyPushNotification).not.toHaveBeenCalled();
  });

  it("un errore della push di test non rompe la subscribe", async () => {
    pushService.getPushSubscription.mockResolvedValue(null);
    pushService.subscribeToPush.mockResolvedValue({
      permission: "granted",
      subscription: { endpoint: "endpoint-1" },
    });
    pushService.sendMyPushNotification.mockRejectedValue(
      new Error("rpc ko"),
    );

    const { result } = renderHook(() => usePush());

    await act(async () => {
      const ret = await result.current.subscribe();

      expect(ret.error).toBeNull();
      expect(ret.subscription).not.toBeNull();
    });

    expect(reportError).toHaveBeenCalled();
    expect(result.current.subscribeError).toBeNull();
  });
});