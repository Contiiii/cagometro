import { useCallback, useEffect, useState } from "react";

import { ProfileContext } from "./profile-context";

import { useAuth } from "../hooks/useAuth";

import {
  getProfile,
  updateProfile as updateProfileService,
} from "../services/profileService";

export function ProfileProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await getProfile(user.id);

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
  }, [user, authLoading]);

  const updateProfile = useCallback(
    async ({ displayName, avatarUrl }) => {
      if (!user) {
        throw new Error("Utente non autenticato");
      }

      const updatedProfile = await updateProfileService({
        userId: user.id,
        displayName,
        avatarUrl,
      });

      setProfile(updatedProfile);

      return updatedProfile;
    },
    [user],
  );

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
