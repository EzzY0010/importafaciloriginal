import { useState, useEffect, createContext, useContext } from 'react';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { getSupabaseClient, isBackendConfigured } from '@/lib/backend';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminRole = async (userId: string, client: SupabaseClient<Database>) => {
    const { data } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const checkPaymentStatus = async (userId: string, client: SupabaseClient<Database>) => {
    const { data } = await client
      .from('profiles')
      .select('has_paid')
      .eq('id', userId)
      .maybeSingle();

    setHasPaid(data?.has_paid ?? false);
  };

  const refreshPaymentStatus = async () => {
    const client = await getSupabaseClient();
    if (user && client) {
      await checkPaymentStatus(user.id, client);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const initAuth = async () => {
      if (!isBackendConfigured) {
        if (isMounted) {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setHasPaid(false);
          setLoading(false);
        }
        return;
      }

      try {
        const client = await getSupabaseClient();
        if (!client) {
          if (isMounted) setLoading(false);
          return;
        }

        const { data } = client.auth.onAuthStateChange((event, nextSession) => {
          if (!isMounted) return;

          setSession(nextSession);
          setUser(nextSession?.user ?? null);
          setLoading(false);

          if (nextSession?.user) {
            setTimeout(() => {
              checkAdminRole(nextSession.user.id, client);
              checkPaymentStatus(nextSession.user.id, client);
            }, 0);
          } else {
            setIsAdmin(false);
            setHasPaid(false);
          }
        });

        unsubscribe = () => data.subscription.unsubscribe();

        const {
          data: { session: currentSession },
        } = await client.auth.getSession();

        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        if (currentSession?.user) {
          await Promise.all([
            checkAdminRole(currentSession.user.id, client),
            checkPaymentStatus(currentSession.user.id, client),
          ]);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const client = await getSupabaseClient();
    if (!client) {
      return { error: new Error('Backend indisponível no momento.') };
    }

    const { error } = await client.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const client = await getSupabaseClient();
    if (!client) {
      return { error: new Error('Backend indisponível no momento.') };
    }

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    return { error };
  };

  const signOut = async () => {
    const client = await getSupabaseClient();
    if (!client) {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setHasPaid(false);
      return;
    }

    await client.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, hasPaid, loading, signIn, signUp, signOut, refreshPaymentStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
