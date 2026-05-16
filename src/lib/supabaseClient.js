import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kirxkuhonawrcjvvidbp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_C4mRCImFRDR6HOnJytGzmw_JcVVa4_W'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
