import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ProfileContext } from "./profile-context";

import { useAuth } from "../hooks/useAuth";

import { loadProfileSnapshot, saveProfileSnapshot } from "../utils/storage";

import { reportError } from "../utils/reportError";

import {
  getProfile,
  updateProfile as updateProfileService,
  flushProfileQueue,
} from "../services/profileService";

export function ProfileProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);

  const userId = user?.id ?? null;

  const [hydratedUserId, setHydratedUserId] = useState(() => userId);

  // Evita che lo snapshot di un account precedente venga salvato
  // sotto la chiave del nuovo account durante il cambio utente.
  const profileOwnerRef = useRef(null);

  useEffect(() => {
    if (authLoading || !userId) {
      return;
    }

    let cancelled = false;

    // Idrata dallo snapshot locale PRIMA della risposta di rete, così la
    // UI mostra subito l'ultimo profilo conosciuto e poi quello fresco.
    const cached = loadProfileSnapshot(userId);

    async function loadProfile() {
      await new Promise((resolve) => window.setTimeout(resolve, 0));

      if (cancelled) {
        return;
      }

      if (cached) {
        profileOwnerRef.current = userId;
        setProfile(cached);
      }

      try {
        const data = await getProfile(userId);

        if (!cancelled) {
          profileOwnerRef.current = userId;
          setProfile(data);
        }
      } catch (error) {
        reportError(error, {
          feature: "profile-load",
          userId,
          message: "Errore caricamento profilo:",
        });
      }

      if (!cancelled) {
        setHydratedUserId(userId);
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
          profileOwnerRef.current = userId;
          setProfile(data);
        }
      } catch (error) {
        reportError(error, {
          feature: "profile-sync",
          userId,
          message: "Errore sincronizzazione profilo:",
        });
      }
    }

    syncQueuedProfile();

    window.addEventListener("online", syncQueuedProfile);

    return () => {
      cancelled = true;
      window.removeEventListener("online", syncQueuedProfile);
    };
  }, [userId, authLoading]);

  // Persiste l'ultimo profilo noto per la modalità offline, solo se appartiene
  // davvero all'utente corrente.
  useEffect(() => {
    if (!userId || profileOwnerRef.current !== userId || !profile) {
      return;
    }

    saveProfileSnapshot(userId, profile);
  }, [profile, userId]);

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
          ...(displayName !== undefined && { display_name: displayName }),
          ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
        };

        profileOwnerRef.current = userId;
        setProfile((current) => ({ ...(current ?? {}), ...optimisticProfile }));

        return optimisticProfile;
      }

      profileOwnerRef.current = userId;
      setProfile(updatedProfile);

      return updatedProfile;
    },
    [userId],
  );

  const hydrated = hydratedUserId === userId;

  const loading = authLoading || (userId ? !hydrated : false);

  const value = useMemo(
    () => ({
      profile: userId ? profile : null,
      loading,
      updateProfile,
    }),
    [userId, profile, loading, updateProfile],
  );

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}
