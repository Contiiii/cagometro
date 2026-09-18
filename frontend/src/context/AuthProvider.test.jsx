// @vitest-environment jsdom
import { useContext, useEffect } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext } from "./auth-context";
import { AuthProvider } from "./AuthProvider";
import { supabase } from "../lib/supabase";
import { detachPushSubscription } from "../services/pushService";

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock("../services/pushService", () => ({
  detachPushSubscription: vi.fn(),
}));

let capturedLogout = null;

function TestHarness() {
  const { logout, user } = useContext(AuthContext);

  useEffect(() => {
    capturedLogout = logout;
  });

  return (
    <div>
      <span data-testid="user">{user ? user.id : "none"}</span>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  capturedLogout = null;

  supabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: "u-1" } } },
    error: null,
  });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  supabase.auth.signOut.mockResolvedValue({ error: null });
  detachPushSubscription.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
});

async function renderProvider() {
  render(
    <AuthProvider>
      <TestHarness />
    </AuthProvider>,
  );

  await waitFor(() => {
    expect(screen.getByTestId("user").textContent).toBe("u-1");
  });
}

describe("AuthProvider.logout", () => {
  it("distacca la push subscription prima di signOut", async () => {
    await renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    expect(detachPushSubscription).toHaveBeenCalled();
    expect(detachPushSubscription).toHaveBeenCalledBefore(
      supabase.auth.signOut,
    );
  });

  it("esegue comunque signOut se il detach fallisce", async () => {
    await renderProvider();

    detachPushSubscription.mockRejectedValueOnce(new Error("boom"));

    fireEvent.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it("propaga l'errore di signOut", async () => {
    await renderProvider();

    supabase.auth.signOut.mockResolvedValue({
      error: { message: "sign out ko" },
    });

    await expect(capturedLogout()).rejects.toThrow("sign out ko");
    expect(detachPushSubscription).toHaveBeenCalled();
  });
});