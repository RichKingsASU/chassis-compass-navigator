// src/lib/invoiceClient.ts
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import * as XLSX from "xlsx";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export type ExtractResponse = {
  ok: boolean;
  invoice_id?: string;
  status?: string; // "VALIDATED (Gemini)" | "ERROR: Total Mismatch" | etc.
  totals?: { header_total: number; sum_line_items: number };
  error?: string;
};

export function makeFolderPath(opts: {
  vendor: "wccp" | string;
  year?: number; month?: number; uuid?: string;
}) {
  const now = new Date();
  const year = opts.year ?? now.getFullYear();
  const month = String((opts.month ?? now.getMonth() + 1)).padStart(2, "0");
  const id = opts.uuid ?? crypto.randomUUID?.() ?? nanoid();
  return `vendor/${opts.vendor}/invoices/${year}/${month}/${id}`;
}

export async function ensureSession() {
  const { data: { session } } = await supabase.auth.getSession();
  // You can force sign-in here if you require auth on the function.
  return session;
}

export async function xlsxFileToCsvBlob(file: File): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf);
  const first = wb.SheetNames[0];
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets[first], { FS: ",", RS: "\n" });
  return new Blob([csv], { type: "text/csv" });
}

export async function uploadToBucket(args: {
  bucket: string; path: string; file: Blob | File; contentType: string;
}) {
  const { bucket, path, file, contentType } = args;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType, upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function callExtractInvoice(args: {
  pdfPath: string; csvPath: string; requireJwt?: boolean;
}) {
  const { pdfPath, csvPath, requireJwt = true } = args;

  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (requireJwt && session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract_invoice_data`,
    { method: "POST", headers, body: JSON.stringify({ pdfPath, csvPath }) }
  );

  const text = await res.text();
  let json: ExtractResponse;
  try { json = JSON.parse(text); } catch { json = { ok: false, error: text }; }
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `HTTP ${res.status}: ${text}`);
  }
  return json;
}
