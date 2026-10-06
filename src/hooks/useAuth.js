import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password) => supabase.auth.signUp({ email, password });

  const signOut = () => supabase.auth.signOut();

  return { user, ready, signIn, signUp, signOut, configured: isSupabaseConfigured };
};
