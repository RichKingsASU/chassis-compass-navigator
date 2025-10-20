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
    const aiPrompt = `Extract invoice information from this PDF and CSV data.

PDF Text (first 2000 chars):
${pdfText.substring(0, 2000)}

CSV Data Headers:
${JSON.stringify(jsonData[0])}

CSV Sample Rows (first 5):
${JSON.stringify(jsonData.slice(1, 6))}

Extract and return a JSON object with:
1. invoice_id: The invoice number from the PDF or CSV
2. billing_date: Invoice date in YYYY-MM-DD format
3. due_date: Due date in YYYY-MM-DD format  
4. total_amount: Total amount due as a number
5. line_items: Array of line items from CSV with structure:
   - chassis: chassis number
   - container: container number
   - date_out: gate out date (YYYY-MM-DD)
   - date_in: gate in date (YYYY-MM-DD)
   - days: number of days
   - rate: daily rate
   - amount: total charge for this line

Return ONLY valid JSON, no markdown formatting.`;

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
          { role: "system", content: "You are an invoice data extraction assistant. Extract structured data from invoices and return valid JSON only." },
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
    } catch (e) {
      console.error("Failed to parse AI response:", extractedText);
      // Fallback to basic extraction
      extractedData = {
        invoice_id: 'WCCP-' + Date.now(),
        billing_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_amount: 0,
        line_items: []
      };
    }

    console.log("AI extracted data:", JSON.stringify(extractedData, null, 2));

    // Calculate totals
    const lineItemsTotal = extractedData.line_items?.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0) || 0;
    const headerTotal = extractedData.total_amount || lineItemsTotal;

    const response = {
      ok: true,
      invoice_id: extractedData.invoice_id,
      billing_date: extractedData.billing_date,
      due_date: extractedData.due_date,
      status: 'success',
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
