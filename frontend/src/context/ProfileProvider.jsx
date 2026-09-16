import { useCallback, useEffect, useMemo, useState } from "react";

import { ProfileContext } from "./profile-context";

import { useAuth } from "../hooks/useAuth";

import {
  getProfile,
  updateProfile as updateProfileService,
  flushProfileQueue,
} from "../services/profileService";

export function ProfileProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading || !userId) {
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await getProfile(userId);

        if (!cancelled) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Errore caricamento profilo:", error);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [userId, authLoading]);

  useEffect(() => {
    if (authLoading || !userId) {
      return;
    }

    let cancelled = false;

    async function syncQueuedProfile() {
      try {
        const allSynced = await flushProfileQueue(userId);

        if (!allSynced || cancelled) {
          return;
        }

        const data = await getProfile(userId);

        if (!cancelled) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Errore sincronizzazione profilo:", error);
      }
    }

    syncQueuedProfile();

    window.addEventListener("online", syncQueuedProfile);

    return () => {
      cancelled = true;
      window.removeEventListener("online", syncQueuedProfile);
    };
  }, [userId, authLoading]);

  const updateProfile = useCallback(
    async ({ displayName, avatarUrl }) => {
      if (!userId) {
        throw new Error("Utente non autenticato");
      }

      const updatedProfile = await updateProfileService({
        userId,
        displayName,
        avatarUrl,
      });

      if (updatedProfile?.queued) {
        const optimisticProfile = {
          user_id: userId,
          display_name: displayName,
          avatar_url: avatarUrl,
        };

        setProfile((current) => ({ ...(current ?? {}), ...optimisticProfile }));

        return optimisticProfile;
      }

      setProfile(updatedProfile);

      return updatedProfile;
    },
    [userId],
  );

  const value = useMemo(
    () => ({
      profile: userId ? profile : null,
      updateProfile,
    }),
    [userId, profile, updateProfile],
  );

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}
