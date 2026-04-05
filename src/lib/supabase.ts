import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase environment variables not set. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local. ' +
    'Expected project: bribgwhzbvktheayahxu'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://bribgwhzbvktheayahxu.supabase.co',
  supabaseAnonKey || '',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
