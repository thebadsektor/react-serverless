import { supabase } from './supabaseClient';

export const signIn = async (email, password) => {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return user;
};

export const signOut = async () => {
    await supabase.auth.signOut();
}; 