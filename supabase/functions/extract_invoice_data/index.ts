// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import schema from "./schema.json" with { type: "json" };

type GeminiResponse = {
  Header: {
    Invoice_ID: string;
    Vendor?: string;
    Invoice_Date?: string;
    Due_Date?: string;
    Currency?: string;
    Total_Amount_Due: number;
  };
  Line_Items: Array<{
    Line_No?: number;
    Description: string;
    Quantity?: number;
    Unit_Price?: number;
    Total_Charge: number;
    Extra?: Record<string, any>;
  }>;
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = Deno.env.get("GEMINI_MODEL") ?? "models/gemini-1.5-pro"; // override if needed

const sbAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function downloadAsBase64(bucket: string, path: string) {
  const { data, error } = await sbAdmin.storage.from(bucket).download(path);
  if (error) throw error;
  const buf = await data.arrayBuffer();
  const bytes = new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes));
}

Deno.serve(async (req) => {
  try {
    // Expect JSON { pdfPath, csvPath } both relative to bucket 'wccp-invoices'
    const { pdfPath, csvPath } = await req.json();

    if (!pdfPath || !csvPath) {
      return new Response(
        JSON.stringify({ error: "Missing pdfPath or csvPath" }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    // 1) Download files from Storage
    const base64PDF = await downloadAsBase64("wccp-invoices", pdfPath);
    const base64CSV = await downloadAsBase64("wccp-invoices", csvPath);

    // 2) Build Gemini payload (multimodal)
    const prompt = [
      "You are extracting an invoice.",
      "Use the PDF (header) and CSV (line items) to produce EXACTLY the provided JSON schema.",
      "Rules:",
      "- Return ONLY application/json; no prose.",
      "- Dates must be ISO (YYYY-MM-DD).",
      "- Numbers must be numeric (no currency symbols).",
      "- Map ALL CSV rows into Line_Items.",
      "- If a column doesn't fit the standard fields, put it under Line_Items[].Extra.",
      "- The header total must equal the sum of Line_Items[].Total_Charge (do not invent rows).",
    ].join("\n");

    const payload = {
      contents: [{
        parts: [
          { inlineData: { mimeType: "application/pdf", data: base64PDF } },
          { inlineData: { mimeType: "text/csv", data: base64CSV } },
          { text: prompt },
        ],
      }],
      // Generation config for JSON mode
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
      },
    };

    // 3) Call Gemini (REST)
    const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Gemini error ${resp.status}: ${t}`);
    }

    const gemini = await resp.json();

    // Gemini JSON text can appear in candidates[0].content.parts[0].text
    const jsonText =
      gemini?.candidates?.[0]?.content?.parts?.[0]?.text ??
      gemini?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!jsonText) throw new Error("No JSON content returned from Gemini.");

    const data: GeminiResponse = JSON.parse(jsonText);

    // 4) Persist to DB (atomic upsert)
    const h = data.Header;

    // header upsert
    const { error: hErr } = await sbAdmin.from("invoices_header").upsert({
      invoice_id: h.Invoice_ID,
      vendor: h.Vendor ?? null,
      invoice_date: h.Invoice_Date ?? null,
      due_date: h.Due_Date ?? null,
      currency: h.Currency ?? null,
      total_amount_due: h.Total_Amount_Due,
      source_pdf_path: pdfPath,
      source_csv_path: csvPath,
      gemini_raw: data,
      status: "PENDING",
    }, { onConflict: "invoice_id" });
    if (hErr) throw hErr;

    // delete existing items for idempotency
    await sbAdmin.from("invoices_line_items").delete()
      .eq("invoice_id", h.Invoice_ID);

    // line items insert
    const items = (data.Line_Items ?? []).map((r, i) => ({
      invoice_id: h.Invoice_ID,
      line_no: r.Line_No ?? i + 1,
      description: r.Description ?? null,
      quantity: r.Quantity ?? null,
      unit_price: r.Unit_Price ?? null,
      total_charge: r.Total_Charge ?? null,
      extra: r.Extra ?? null,
    }));

    if (items.length) {
      const { error: liErr } = await sbAdmin.from("invoices_line_items").insert(items);
      if (liErr) throw liErr;
    }

    // 5) Validate totals & update status
    const { data: agg, error: aggErr } = await sbAdmin
      .from("v_invoice_totals")
      .select("*")
      .eq("invoice_id", h.Invoice_ID)
      .single();

    if (aggErr) throw aggErr;

    const matches =
      Number(agg.sum_line_total ?? 0).toFixed(2) ===
      Number(agg.total_amount_due ?? 0).toFixed(2);

    const status = matches ? "VALIDATED (Gemini)" : "ERROR: Total Mismatch";

    await sbAdmin.from("invoices_header")
      .update({ status })
      .eq("invoice_id", h.Invoice_ID);

    return new Response(JSON.stringify({
      ok: true,
      invoice_id: h.Invoice_ID,
      status,
      totals: {
        header_total: agg.total_amount_due,
        sum_line_items: agg.sum_line_total,
      },
    }), { headers: { "content-type": "application/json" } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
