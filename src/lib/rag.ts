import { supabase } from './supabase-browser';

export async function askRag(query: string) {
  const sess = (await supabase.auth.getSession()).data.session;
  if (!sess?.access_token) throw new Error('No session');
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat-rag`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sess.access_token}`
      },
      body: JSON.stringify({ query })
    }
  );
  if (!res.ok) throw new Error(`RAG error ${res.status}`);
  return res.json(); // { query, matches: [{ content, score, source_table, source_pk }]}
}
