"use client";

import type { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthValue { user: User | null; loading: boolean; configured: boolean; signOut: () => Promise<void> }
const AuthContext = createContext<AuthValue>({ user: null, loading: true, configured: false, signOut: async () => undefined });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) { setUser(data.user); setLoading(false); }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) { setUser(session?.user ?? null); setLoading(false); }
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [supabase]);

  const value = useMemo<AuthValue>(() => ({
    user, loading, configured: Boolean(supabase),
    async signOut() { if (supabase) await supabase.auth.signOut(); setUser(null); },
  }), [loading, supabase, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
