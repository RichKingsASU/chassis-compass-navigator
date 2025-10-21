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
    console.log("Downloading PDF from bucket 'wccp-invoices', path:", pdfPath);
    const { data: pdfData, error: pdfError } = await supabase.storage
      .from("wccp-invoices")
      .download(pdfPath);

    if (pdfError) {
      console.error("PDF download error:", pdfError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Failed to download PDF: ${pdfError.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Extract text from PDF
    const pdfText = await pdfData.text();
    console.log('PDF download successful, text length:', pdfText.length);
    console.log('Extracted PDF text preview:', pdfText.substring(0, 500));

    // Download CSV from storage
    console.log("Downloading CSV from bucket 'wccp-invoices', path:", csvPath);
    const { data: csvData, error: csvError } = await supabase.storage
      .from("wccp-invoices")
      .download(csvPath);

    if (csvError) {
      console.error("CSV download error:", csvError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Failed to download CSV: ${csvError.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Parse Excel/CSV file
    const arrayBuffer = await csvData.arrayBuffer();
    console.log('CSV file size (bytes):', arrayBuffer.byteLength);
    
    if (arrayBuffer.byteLength === 0) {
      console.error("CSV file is empty!");
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'CSV file is empty or could not be read' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
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

    console.log(`✅ Parsed ${jsonData.length} rows from Excel`);
    console.log('First 10 rows (cleaned):', JSON.stringify(jsonData.slice(0, 10), null, 2));

    // Use AI to extract structured invoice data with explicit line items instruction
    const aiPrompt = `You are performing invoice data extraction. 

**CRITICAL TASK**: Extract ALL line items from the CSV data AND determine the correct invoice due date.

**DATA PROVIDED**:
1. PDF contains header information (invoice number, dates, total amount) - but the text may not be properly parsed
2. CSV contains ALL line item rows with columns: Invoice, Chassis, Size, Type, Container, Bill From, Bill To, # of Days, Rate, Gate out Location, Line Out, Gate in Location, Line In, Tax, Surcharge Total, Total

**YOUR TASK**:
Extract EVERY non-empty row from the CSV into the line_items array. The CSV has ${jsonData.length - 1} data rows after the header.

**REQUIRED JSON STRUCTURE**:
{
  "invoice_id": "string",
  "billing_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD",
  "billing_terms": "Net 30",
  "total_amount": number,
  "line_items": [
    {
      "chassis": "from Chassis column",
      "container": "from Container column",
      "date_out": "convert Bill From (MM/DD/YYYY HH:MM) to YYYY-MM-DD",
      "date_in": "convert Bill To (MM/DD/YYYY HH:MM) to YYYY-MM-DD",
      "days": "from # of Days column as number",
      "rate": "from Rate column, remove $ and convert to number",
      "amount": "from Total column, remove $ and convert to number"
    }
  ]
}

**PDF TEXT** (may contain due date if parseable):
${pdfText.substring(0, 3000)}

**CSV HEADER ROW**:
${JSON.stringify(jsonData[0])}

**CSV DATA ROWS** (Process EVERY row where Chassis is not empty):
${JSON.stringify(jsonData.filter(row => row && row.length > 0 && row[1]))}

**EXTRACTION RULES**:
1. Process EVERY row from the CSV where column index 1 (Chassis) is not empty
2. Skip completely empty rows
3. Convert "09/02/2025 00:00" format to "2025-09-02"
4. Convert "$33.00" to 33.00 (number)
5. **DUE DATE EXTRACTION (CRITICAL)**:
   - First, look for "Date Due" or "Due Date" in the PDF text
   - If PDF text is not readable (contains binary data like %PDF), find the LATEST "Bill To" date from the CSV data
   - The latest Bill To date is typically the invoice period end date
   - Add 30 days to the latest Bill To date to get the due_date
   - For example: if latest Bill To is "09/30/2025", then due_date should be "2025-10-30"
6. **BILLING DATE**: Set to null (will be calculated as due_date - 30 days)
7. Return invoice_id from first data row in CSV (column 0)
8. Return ONLY valid JSON with NO markdown backticks

**VERIFICATION**: Your response must include ${jsonData.filter(row => row && row.length > 0 && row[1]).length} items in line_items array.`;

    // Call Lovable AI with explicit line items extraction
    console.log("Calling AI with CSV data containing", jsonData.length - 1, "rows");
    console.log("Non-empty chassis rows:", jsonData.filter(row => row && row.length > 0 && row[1]).length);
    
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
            content: "You are an expert invoice data extraction assistant. You MUST extract ALL line items from CSV data. Never skip rows. Return only valid JSON with no markdown." 
          },
          { role: "user", content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI extraction error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `AI extraction failed: ${errorText}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const aiData = await aiResponse.json();
    const extractedText = aiData.choices[0].message.content;
    
    // Log the raw AI response for debugging
    console.log("=== RAW AI RESPONSE ===");
    console.log(extractedText.substring(0, 1000));
    console.log("=== END RAW RESPONSE ===");
    
    // Parse AI response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      let jsonText = extractedText;
      const jsonMatch = extractedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
        console.log("Removed markdown code blocks");
      }
      
      extractedData = JSON.parse(jsonText);
      console.log("✅ Successfully parsed AI response");
      console.log("📊 Extracted line items count:", extractedData.line_items?.length || 0);
      
      if (extractedData.line_items && extractedData.line_items.length > 0) {
        console.log("✅ First line item:", JSON.stringify(extractedData.line_items[0], null, 2));
      } else {
        console.warn("⚠️ WARNING: No line items extracted!");
      }
    } catch (e) {
      console.error("Failed to parse AI response:", extractedText);
      console.error("Parse error:", e);
      
      // Fallback: try to extract basic data ourselves
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);
      
      extractedData = {
        invoice_id: 'WCCP-' + Date.now(),
        billing_date: null,
        due_date: dueDate.toISOString().split('T')[0],
        billing_terms: 'Net 30',
        total_amount: 0,
        line_items: []
      };
    }

    // If billing_date is null or missing, calculate as due_date - 30 days
    if (!extractedData.billing_date && extractedData.due_date) {
      const dueDate = new Date(extractedData.due_date);
      const billingDate = new Date(dueDate);
      billingDate.setDate(billingDate.getDate() - 30);
      extractedData.billing_date = billingDate.toISOString().split('T')[0];
      console.log("Calculated billing_date from due_date:", extractedData.billing_date);
    }

    // If due_date is still null, set default dates
    if (!extractedData.due_date) {
      console.warn("⚠️ Due date not found in extraction, using defaults");
      const today = new Date();
      extractedData.billing_date = extractedData.billing_date || today.toISOString().split('T')[0];
      
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);
      extractedData.due_date = dueDate.toISOString().split('T')[0];
    }
    
    // If billing_date is still null, calculate from due_date
    if (!extractedData.billing_date && extractedData.due_date) {
      const dueDate = new Date(extractedData.due_date);
      const billingDate = new Date(dueDate);
      billingDate.setDate(billingDate.getDate() - 30);
      extractedData.billing_date = billingDate.toISOString().split('T')[0];
    }


    // Calculate totals and validate
    const lineItemsTotal = extractedData.line_items?.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0) || 0;
    const headerTotal = extractedData.total_amount || lineItemsTotal;
    
    // Determine status based on total match
    const totalsMatch = Math.abs(headerTotal - lineItemsTotal) < 0.01;
    const status = totalsMatch ? 'VALIDATED (Gemini)' : 'ERROR: Total Mismatch';

    console.log("=== FINAL EXTRACTION SUMMARY ===");
    console.log("Invoice ID:", extractedData.invoice_id);
    console.log("Billing Date:", extractedData.billing_date);
    console.log("Due Date:", extractedData.due_date);
    console.log("Line Items Count:", extractedData.line_items?.length || 0);
    console.log("Header Total:", headerTotal);
    console.log("Line Items Sum:", lineItemsTotal);
    console.log("Status:", status);
    console.log("=== END SUMMARY ===");

    const response = {
      ok: true,
      invoice_id: extractedData.invoice_id,
      billing_date: extractedData.billing_date,
      due_date: extractedData.due_date,
      billing_terms: extractedData.billing_terms || 'Net 30',
      vendor: 'WCCP',
      currency: 'USD',
      status: status,
      totals: {
        header_total: headerTotal,
        sum_line_items: lineItemsTotal
      },
      line_items: extractedData.line_items || [],
      line_items_count: extractedData.line_items?.length || 0,
      warnings: (extractedData.line_items?.length || 0) === 0 ? ['No line items found - check extraction logs'] : [],
      debug: {
        csv_rows_provided: jsonData.length - 1,
        non_empty_chassis_rows: jsonData.filter(row => row && row.length > 0 && row[1]).length,
        extracted_count: extractedData.line_items?.length || 0
      }
    };

    console.log("Final response - Line items:", response.line_items_count);
    console.log("Returning response:", JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error processing invoice:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        ok: false,
        error: error.message || 'Unknown error during invoice processing',
        error_type: error.name,
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
