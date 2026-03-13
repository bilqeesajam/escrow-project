import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dyjvzjrjrclpevuzgtif.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5anZ6anJqcmNscGV2dXpndGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDU4MTcsImV4cCI6MjA4ODgyMTgxN30.N0vf0RjEOjUaCqRny0DYJwXlJ4kO_TgxbOxADEq6_Fs";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
