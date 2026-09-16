// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileProvider } from "./ProfileProvider";
import { useProfile } from "../hooks/useProfile";
import { useAuth } from "../hooks/useAuth";
import {
  getProfile,
  updateProfile,
  flushProfileQueue,
} from "../services/profileService";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../services/profileService", () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  flushProfileQueue: vi.fn(),
}));

const SERVER_PROFILE = {
  user_id: "user-1",
  display_name: "Mario",
  avatar_url: "https://example.com/avatar.png",
};

function ProfileHarness({ onValue }) {
  onValue(useProfile());
  return null;
}

function renderProvider() {
  let latest = null;

  render(
    <ProfileProvider>
      <ProfileHarness
        onValue={(value) => {
          latest = value;
        }}
      />
    </ProfileProvider>,
  );

  return {
    getLatest: () => latest,
  };
}

beforeEach(() => {
  localStorage.clear();

  vi.clearAllMocks();

  useAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });

  getProfile.mockResolvedValue(SERVER_PROFILE);
  updateProfile.mockResolvedValue(SERVER_PROFILE);
  flushProfileQueue.mockResolvedValue(true);

  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    writable: true,
    value: true,
  });
});

afterEach(() => {
  cleanup();
});

describe("ProfileProvider", () => {
  it("carica il profilo al mount e lo espone nel context", async () => {
    const { getLatest } = renderProvider();

    await waitFor(() => expect(getProfile).toHaveBeenCalledWith("user-1"));

    expect(getLatest().profile).toEqual(SERVER_PROFILE);
  });

  it("aggiorna il profilo dal server quando la chiamata riesce", async () => {
    const serverResult = {
      user_id: "user-1",
      display_name: "Luca",
      avatar_url: "https://example.com/luca.png",
    };

    updateProfile.mockResolvedValue(serverResult);

    const { getLatest } = renderProvider();

    await waitFor(() => expect(getLatest().profile).toEqual(SERVER_PROFILE));

    await act(async () => {
      await getLatest().updateProfile({
        displayName: "Luca",
        avatarUrl: "https://example.com/luca.png",
      });
    });

    expect(updateProfile).toHaveBeenCalledWith({
      userId: "user-1",
      displayName: "Luca",
      avatarUrl: "https://example.com/luca.png",
    });

    expect(getLatest().profile).toEqual(serverResult);
  });

  it("applica un update ottimistico quando il server è offline (queued)", async () => {
    updateProfile.mockResolvedValue({ queued: true });

    const { getLatest } = renderProvider();

    await waitFor(() => expect(getLatest().profile).toEqual(SERVER_PROFILE));

    await act(async () => {
      await getLatest().updateProfile({ displayName: "Pino" });
    });

    expect(getLatest().profile.display_name).toBe("Pino");

    // L'avatar server esistente non viene azzerato se non passato
    expect(getLatest().profile.avatar_url).toBe(SERVER_PROFILE.avatar_url);
  });

  it("sovrascrive anche l'avatar quando viene fornito nell'update offline", async () => {
    updateProfile.mockResolvedValue({ queued: true });

    const { getLatest } = renderProvider();

    await waitFor(() => expect(getLatest().profile).toEqual(SERVER_PROFILE));

    await act(async () => {
      await getLatest().updateProfile({
        displayName: "Pino",
        avatarUrl: "https://example.com/pino.png",
      });
    });

    expect(getLatest().profile.display_name).toBe("Pino");
    expect(getLatest().profile.avatar_url).toBe(
      "https://example.com/pino.png",
    );
  });

  it("drena la coda e ricarica il profilo al ritorno online", async () => {
    renderProvider();

    await waitFor(() => expect(getProfile).toHaveBeenCalled());

    getProfile.mockClear();
    flushProfileQueue.mockClear();

    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() =>
      expect(flushProfileQueue).toHaveBeenCalledWith("user-1"),
    );

    await waitFor(() => expect(getProfile).toHaveBeenCalledWith("user-1"));
  });
});