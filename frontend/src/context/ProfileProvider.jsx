import { useCallback, useEffect, useMemo, useState } from "react";

import { ProfileContext } from "./profile-context";

import { useAuth } from "../hooks/useAuth";

import {
  getProfile,
  updateProfile as updateProfileService,
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
