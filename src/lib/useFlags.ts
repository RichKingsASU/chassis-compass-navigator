import { supabase } from './supabase-browser';

export async function fetchFlags(role = 'dispatcher') {
  const sess = (await supabase.auth.getSession()).data.session;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/flags`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sess?.access_token ?? ''}`
      },
      body: JSON.stringify({ role })
    }
  );
  return res.json();
}
