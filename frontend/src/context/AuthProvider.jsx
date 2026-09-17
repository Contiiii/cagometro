import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./auth-context";
import { reportError } from "../utils/reportError";
import { detachPushSubscription } from "../services/pushService";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        reportError(error, {
          feature: "auth-session-load",
          message: "Errore caricamento sessione:",
        });
      }

      setSession(session);
      setLoading(false);
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (redirectTo) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo || `${window.location.origin}/`,
      },
    });

    if (error) {
      reportError(error, {
        feature: "auth-login",
        message: "Errore durante il login:",
      });
    }
  }, []);

  const logout = useCallback(async () => {
    // Best-effort: se il service worker è lento o assente il detach non deve
    // né bloccare né impedire il logout. Il try/catch è la rete di sicurezza
    // finale nel caso il detach sollevasse comunque un errore.
    try {
      await detachPushSubscription();
    } catch {
      // errore ignorato: il logout prosegue
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }, []);

  const user = session?.user ?? null;

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [session, user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
