import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// When supabaseConfigured is false, all callers guard on it before calling supabase methods.
// The cast avoids having to null-check everywhere — but never call supabase without checking supabaseConfigured first.
export const supabase: SupabaseClient = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (null as unknown as SupabaseClient);
