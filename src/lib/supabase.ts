import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uhycfbhrjnichjxlvzjl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iq2M24AEX_jm-oeuKTuBRA_qQWmzKje';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
