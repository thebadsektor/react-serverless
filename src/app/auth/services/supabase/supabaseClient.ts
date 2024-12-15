import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseClient() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error fetching session:', error);
    } else {
      console.log('Session:', session);
    }
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
  }
}

testSupabaseClient();