import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  verifyEmail: (
    token: string,
    email: string,
  ) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

/**
 * Hook to protect against back navigation when user is signed in.
 * Prevents users from going back using browser back button.
 * When they try to go back while authenticated, the page refreshes.
 * When they sign out and try to go back, they are redirected to login.
 */
export const useProtectedNavigation = () => {
  const { user } = useAuth();
  const prevUserRef = React.useRef<User | null>(null);

  useEffect(() => {
    // Detect if user just signed out (went from authenticated to null)
    const userJustSignedOut = prevUserRef.current !== null && user === null;
    prevUserRef.current = user;

    if (!user) {
      // User is not authenticated
      if (userJustSignedOut) {
        // User just signed out - set up back button to go to login
        // Push a state so back button triggers an event
        window.history.pushState({ loggedOut: true }, "");

        const handlePopState = () => {
          // Redirect to login when they click back after signing out
          window.location.href = "/login";
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
          window.removeEventListener("popstate", handlePopState);
        };
      }
      // User was already signed out, no protection needed
      return;
    }

    // User is authenticated
    // Push a dummy state to the history stack to prevent going back
    const state = { protected: true, timestamp: Date.now() };
    window.history.pushState(state, "");

    // Listen for back button clicks
    const handlePopState = (event: PopStateEvent) => {
      // Refresh the page to prevent going back while authenticated
      window.location.reload();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [user]);
};

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return data ?? null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const handleSession = async (newSession: Session | null) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        let p = await fetchProfile(newSession.user.id);

        // If profile doesn't exist (common with Google OAuth)
        if (!p) {
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({
              id: newSession.user.id,
              full_name: newSession.user.user_metadata?.full_name || "",
              role: "client",
              kyc_status: "pending",
              balance: 0,
            })
            .select()
            .single();

          p = newProfile;
        }

        if (mounted) setProfile(p);
      } else {
        if (mounted) setProfile(null);
      }

      if (mounted) setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) handleSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
  ): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const verifyEmail = async (
    token: string,
    email: string,
  ): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        verifyEmail,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
