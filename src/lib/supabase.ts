import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables not set. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

// ---------------------------------------------------------------------------
// App Settings helpers — uses Supabase `app_settings` table with localStorage
// fallback so the feature works even before the migration is run.
// ---------------------------------------------------------------------------

const SETTINGS_LS_PREFIX = 'app_setting:'

export async function getAppSetting(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single()
    if (!error && data?.value) return data.value
    // Table might not exist — fall through to localStorage
  } catch {
    // ignore
  }
  return localStorage.getItem(SETTINGS_LS_PREFIX + key)
}

export async function setAppSetting(key: string, value: string): Promise<{ ok: boolean; useLocal: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value }, { onConflict: 'key' })
    if (error) throw error
    // Also mirror to localStorage for faster reads / offline
    localStorage.setItem(SETTINGS_LS_PREFIX + key, value)
    return { ok: true, useLocal: false }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    // If the table doesn't exist, save to localStorage as a fallback
    if (msg.includes('does not exist') || msg.includes('42P01') || msg.includes('relation')) {
      localStorage.setItem(SETTINGS_LS_PREFIX + key, value)
      return { ok: true, useLocal: true }
    }
    return { ok: false, useLocal: false, error: msg }
  }
}

export const APP_SETTINGS_TABLE_SQL = `-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON app_settings FOR ALL USING (true) WITH CHECK (true);`
