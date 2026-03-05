import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xrileclqqjpvbutihcxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyaWxlY2xxcWpwdmJ1dGloY3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTg1ODYsImV4cCI6MjA4NzQzNDU4Nn0._vLBtP0_sL59DUFNxMW-BKfqWIltz22XjgZ7j5Xb0ZM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
