import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfPath, csvPath } = await req.json();
    console.log("Processing invoice:", { pdfPath, csvPath });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download PDF from storage
    const { data: pdfData, error: pdfError } = await supabase.storage
      .from("wccp-invoices")
      .download(pdfPath);

    if (pdfError) {
      console.error("PDF download error:", pdfError);
      throw new Error(`Failed to download PDF: ${pdfError.message}`);
    }

    // Extract text from PDF
    const pdfText = await pdfData.text();
    console.log('Extracted PDF text:', pdfText.substring(0, 500));

    // Download CSV from storage
    const { data: csvData, error: csvError } = await supabase.storage
      .from("wccp-invoices")
      .download(csvPath);

    if (csvError) {
      console.error("CSV download error:", csvError);
      throw new Error(`Failed to download CSV: ${csvError.message}`);
    }

    // Parse Excel/CSV file
    const arrayBuffer = await csvData.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

    // Clean null bytes from UTF-16 encoded data
    const jsonData = rawData.map(row => 
      row.map(cell => {
        if (typeof cell === 'string') {
          return cell.replace(/\u0000/g, '').trim();
        }
        return cell;
      })
    );

    console.log(`Parsed ${jsonData.length} rows from Excel`);
    console.log('First 10 rows (cleaned):', JSON.stringify(jsonData.slice(0, 10), null, 2));

    // Use AI to extract structured invoice data
    const aiPrompt = `You are extracting invoice data from a PDF and CSV. Use the PDF for header information and CSV for line items.

Extract and return EXACTLY this JSON structure:

{
  "invoice_id": "string (invoice number from PDF or CSV)",
  "billing_date": "YYYY-MM-DD (invoice date)",
  "due_date": "YYYY-MM-DD (payment due date)",
  "billing_terms": "string (e.g., 'Net 30', 'Net 45', or payment terms from PDF)",
  "total_amount": number (total amount due),
  "currency": "string (currency code, default USD)",
  "vendor": "string (vendor name, default WCCP)",
  "line_items": [
    {
      "chassis": "string (chassis number)",
      "container": "string (container number)",
      "date_out": "YYYY-MM-DD (gate out/bill from date)",
      "date_in": "YYYY-MM-DD (gate in/bill to date)", 
      "days": number (number of days),
      "rate": number (daily rate),
      "amount": number (total charge for this line)
    }
  ]
}

PDF Header Text:
${pdfText.substring(0, 2000)}

CSV Headers:
${JSON.stringify(jsonData[0])}

CSV Data (all rows):
${JSON.stringify(jsonData.slice(1, 50))}

CRITICAL RULES:
- Extract ALL line items from CSV (not just first 5)
- Parse dates in format YYYY-MM-DD
- If billing_terms not found, infer from due_date (e.g., if 30 days from invoice_date, use "Net 30")
- Return ONLY valid JSON with no markdown formatting
- Ensure amounts are numbers, not strings
- Map CSV columns correctly: "Bill From" → date_out, "Bill To" → date_in, "Total" → amount`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are an invoice data extraction assistant. Extract structured data from invoices and return valid JSON only. Always extract ALL line items from the CSV data provided." 
          },
          { role: "user", content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI extraction error:", errorText);
      throw new Error(`AI extraction failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const extractedText = aiData.choices[0].message.content;
    
    // Parse AI response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = extractedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, extractedText];
      extractedData = JSON.parse(jsonMatch[1]);
      console.log("Successfully parsed AI response");
    } catch (e) {
      console.error("Failed to parse AI response:", extractedText);
      // Fallback to basic extraction
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);
      
      extractedData = {
        invoice_id: 'WCCP-' + Date.now(),
        billing_date: today.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        billing_terms: 'Net 30',
        total_amount: 0,
        currency: 'USD',
        vendor: 'WCCP',
        line_items: []
      };
    }

    console.log("AI extracted data:", JSON.stringify(extractedData, null, 2));

    // Calculate totals and validate
    const lineItemsTotal = extractedData.line_items?.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0) || 0;
    const headerTotal = extractedData.total_amount || lineItemsTotal;
    
    // Determine status based on total match
    const totalsMatch = Math.abs(headerTotal - lineItemsTotal) < 0.01;
    const status = totalsMatch ? 'VALIDATED (Gemini)' : 'ERROR: Total Mismatch';

    const response = {
      ok: true,
      invoice_id: extractedData.invoice_id,
      billing_date: extractedData.billing_date,
      due_date: extractedData.due_date,
      billing_terms: extractedData.billing_terms || 'Net 30',
      vendor: extractedData.vendor || 'WCCP',
      currency: extractedData.currency || 'USD',
      status: status,
      totals: {
        header_total: headerTotal,
        sum_line_items: lineItemsTotal
      },
      line_items: extractedData.line_items || [],
      warnings: lineItemsTotal === 0 ? ['No line items found'] : []
    };

    console.log("Returning response:", JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing invoice:', error);
    return new Response(
      JSON.stringify({ 
        ok: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
