import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, AppRole } from '@/types/escrow';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    roles: [],
    loading: true,
  });

  const fetchProfileAndRoles = useCallback(async (userId: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);
    setState(prev => ({
      ...prev,
      profile: profileRes.data as Profile | null,
      roles: (rolesRes.data?.map(r => r.role) ?? []) as AppRole[],
      loading: false,
    }));
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setState(prev => ({ ...prev, user: session?.user ?? null, session }));
        if (session?.user) {
          // defer to avoid deadlock with Supabase auth
          setTimeout(() => fetchProfileAndRoles(session.user.id), 0);
        } else {
          setState(prev => ({ ...prev, profile: null, roles: [], loading: false }));
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ ...prev, user: session?.user ?? null, session }));
      if (session?.user) {
        fetchProfileAndRoles(session.user.id);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileAndRoles]);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (role: AppRole) => state.roles.includes(role);

  return { ...state, signUp, signIn, signOut, hasRole };
}
