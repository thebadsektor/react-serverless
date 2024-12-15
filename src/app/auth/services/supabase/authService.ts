import { supabase } from './supabaseClient'

// Login function
export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: data.user, session: data.session };
};

// Logout function
export const logout = async () => {
  await supabase.auth.signOut();
};
