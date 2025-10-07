'use client';
import { useState } from 'react';
import { askRag } from '../lib/rag';

export default function RagAssistant() {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState<{content:string;score:number;source_table:string;source_pk:string}[]>([]);
  const [error, setError] = useState<string|undefined>();

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(undefined);
    try {
      const data = await askRag(q.trim());
      setAnswers(data.matches ?? []);
    } catch (err:any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <form onSubmit={onAsk} className="flex gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2"
          placeholder="Ask SOPs, billing rules, reroute policy…"
          value={q}
          onChange={e=>setQ(e.target.value)}
        />
        <button disabled={busy || !q.trim()} className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50">
          {busy ? 'Thinking…' : 'Ask'}
        </button>
      </form>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <ul className="space-y-2">
        {answers.map((a, i) => (
          <li key={i} className="rounded-xl border p-3">
            <div className="text-sm text-gray-500">{a.source_table} • {a.source_pk} • score {a.score.toFixed(3)}</div>
            <div className="mt-1">{a.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
