import { createClient } from '@supabase/supabase-js';
import { appEnv, hasSupabaseConfig } from './env';

export const supabase = hasSupabaseConfig
  ? createClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
