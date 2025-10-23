import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

export async function xlsxToCsvBlob(file: File): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf);
  const sheetName = wb.SheetNames[0];
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
  return new Blob([csv], { type: 'text/csv' });
}

export function makeFolderPath(vendor = 'dcli'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = crypto.randomUUID?.() ?? Math.random().toString(36).substring(2);
  return `vendor/${vendor}/invoices/${year}/${month}/${uuid}`;
}

export async function uploadFile(
  path: string,
  file: Blob | File,
  contentType: string
) {
  const { error } = await supabase.storage
    .from('wccp-invoices')
    .upload(path, file, { contentType, upsert: true });
  if (error) {
    throw error;
  }
}

export interface ExtractResponse {
  ok: boolean;
  invoice_id?: string;
  status?: string;
  totals?: { header_total: number; sum_line_items: number };
  error?: string;
}

export async function callExtractInvoice(
  pdfPath: string,
  csvPath: string,
  requireJwt = true
): Promise<ExtractResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (requireJwt && session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract_invoice_data`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ pdfPath, csvPath }),
    }
  );
  const text = await res.text();
  let json: ExtractResponse;
  try {
    json = JSON.parse(text);
  } catch {
    json = { ok: false, error: text };
  }
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `HTTP ${res.status}: ${text}`);
  }
  return json;
}
