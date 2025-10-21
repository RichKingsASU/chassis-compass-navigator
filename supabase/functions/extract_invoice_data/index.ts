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
    
    // Filter to only rows with chassis data (column index 1)
    const dataRows = jsonData.filter(row => row && row.length > 1 && row[1] && row[1].toString().trim() !== '');
    console.log(`📋 Filtered to ${dataRows.length} data rows with chassis`);
    console.log('All chassis numbers:', dataRows.map(r => r[1]).join(', '));


    // Use AI to extract structured invoice data with explicit validation
    const aiPrompt = `You are an expert invoice data extraction engine.

**TASK**: Extract ALL ${dataRows.length} line items from the CSV data.

**INPUT DOCUMENTS**:
1. PDF Invoice Header - May contain invoice metadata
2. CSV Line Items - Contains ${dataRows.length} rows of transaction data (already filtered, no empty rows)

**REQUIRED OUTPUT SCHEMA**:
{
  "invoice_id": "string from CSV column 0",
  "billing_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD (see rule 5)",
  "billing_terms": "Net 30",
  "total_amount": number,
  "validation_status": "VALIDATED or TOTAL_MISMATCH",
  "line_items": [
    {
      "chassis": "string",
      "container": "string", 
      "date_out": "YYYY-MM-DD",
      "date_in": "YYYY-MM-DD",
      "days": number,
      "rate": number,
      "amount": number
    }
  ]
}

**CSV STRUCTURE**:
Header: ${JSON.stringify(jsonData[0])}

**ALL DATA ROWS** (you MUST extract all ${dataRows.length} items):
${JSON.stringify(dataRows, null, 2)}

**EXTRACTION RULES** (CRITICAL):
1. Extract ALL ${dataRows.length} rows above into line_items array
2. Date conversion: "09/02/2025 00:00" → "2025-09-02"
3. Currency: "$33.00" → 33.00
4. Chassis from column[1], Container from column[4]
5. **DUE DATE**: Find latest "Bill To" date (column[6]) + 30 days
6. **VALIDATION**: 
   - sum_line_items = sum of all amounts
   - If sum matches total_amount: "VALIDATED"
   - Otherwise: "TOTAL_MISMATCH"
7. Return ONLY valid JSON, NO markdown

**CRITICAL**: Your line_items array MUST contain exactly ${dataRows.length} items.

Return JSON now:`;

    // Call Lovable AI with explicit line items extraction
    console.log("Calling AI with CSV data:");
    console.log("  - Total CSV rows:", jsonData.length);
    console.log("  - Data rows with chassis:", dataRows.length);
    console.log("  - Chassis list:", dataRows.map(r => r[1]).join(', '));
    
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
      
      // Validate line items were extracted
      if (!extractedData.line_items || extractedData.line_items.length === 0) {
        console.error("⚠️ CRITICAL: No line items extracted from AI response!");
        throw new Error("AI extraction returned zero line items");
      }
      
      console.log("✅ First line item:", JSON.stringify(extractedData.line_items[0], null, 2));
      
      // Calculate and verify totals
      const lineItemsTotal = extractedData.line_items.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.amount) || 0), 0
      );
      const headerTotal = extractedData.total_amount || 0;
      const totalsMatch = Math.abs(headerTotal - lineItemsTotal) < 0.01;
      
      console.log("💰 Header Total:", headerTotal);
      console.log("💰 Line Items Sum:", lineItemsTotal);
      console.log("✓ Totals Match:", totalsMatch);
      
      // Override validation status with our calculation
      extractedData.validation_status = totalsMatch ? 'VALIDATED' : 'TOTAL_MISMATCH';
      
      // Verify all line items have required fields
      const invalidItems = extractedData.line_items.filter((item: any) => 
        !item.chassis || !item.amount || item.amount === 0
      );
      if (invalidItems.length > 0) {
        console.warn(`⚠️ WARNING: ${invalidItems.length} line items missing required fields:`, 
          JSON.stringify(invalidItems, null, 2));
      }
      
    } catch (e) {
      console.error("❌ Failed to parse AI response:", extractedText.substring(0, 500));
      console.error("Parse error:", e);
      
      // Return error response instead of fallback
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'AI extraction failed to return valid JSON',
          error_type: 'PARSE_ERROR',
          ai_response_preview: extractedText.substring(0, 500)
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
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

    // Calculate totals and determine final status
    const lineItemsTotal = extractedData.line_items?.reduce((sum: number, item: any) => 
      sum + (parseFloat(item.amount) || 0), 0
    ) || 0;
    const headerTotal = extractedData.total_amount || lineItemsTotal;
    
    // Determine status based on validation
    const totalsMatch = Math.abs(headerTotal - lineItemsTotal) < 0.01;
    const validationStatus = extractedData.validation_status || (totalsMatch ? 'VALIDATED' : 'TOTAL_MISMATCH');
    const status = validationStatus === 'VALIDATED' ? 'VALIDATED (Gemini)' : 'ERROR: Total Mismatch';

    console.log("=== FINAL EXTRACTION SUMMARY ===");
    console.log("Invoice ID:", extractedData.invoice_id);
    console.log("Billing Date:", extractedData.billing_date);
    console.log("Due Date:", extractedData.due_date);
    console.log("Line Items Count:", extractedData.line_items?.length || 0);
    console.log("Header Total:", headerTotal);
    console.log("Line Items Sum:", lineItemsTotal);
    console.log("Validation Status:", validationStatus);
    console.log("Final Status:", status);
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
      validation_status: validationStatus,
      totals: {
        header_total: headerTotal,
        sum_line_items: lineItemsTotal,
        difference: Math.abs(headerTotal - lineItemsTotal)
      },
      line_items: extractedData.line_items || [],
      line_items_count: extractedData.line_items?.length || 0,
      warnings: [],
      debug: {
        csv_total_rows: jsonData.length,
        csv_data_rows: dataRows.length,
        extracted_count: extractedData.line_items?.length || 0,
        all_chassis: dataRows.map(r => r[1]),
        extracted_chassis: (extractedData.line_items || []).map((i: any) => i.chassis)
      }
    };

    // Add warnings if totals don't match
    if (validationStatus === 'TOTAL_MISMATCH') {
      response.warnings.push(
        `Total mismatch: Header shows $${headerTotal.toFixed(2)}, ` +
        `but line items sum to $${lineItemsTotal.toFixed(2)} ` +
        `(difference: $${Math.abs(headerTotal - lineItemsTotal).toFixed(2)})`
      );
    }

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
