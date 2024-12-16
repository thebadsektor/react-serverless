import { createClient } from '@supabase/supabase-js';
import supabaseAuthConfig from './supabaseAuthConfig';

export const supabase = createClient(
  supabaseAuthConfig.supabaseUrl,
  supabaseAuthConfig.supabaseKey
); 