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

    // Download CSV/Excel from storage
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

    // Extract invoice summary from PDF text
    let invoiceId = '';
    let totalAmount = 0;
    let dueDate = '';

    // Extract Invoice # from PDF
    const invoiceMatch = pdfText.match(/Invoice\s*#?\s*:?\s*(\d+)/i);
    if (invoiceMatch) {
      invoiceId = invoiceMatch[1];
    }

    // Extract Amount Due from PDF
    const amountMatch = pdfText.match(/Amount\s+Due\s*:?\s*\$?([\d,]+\.?\d*)/i);
    if (amountMatch) {
      totalAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Extract Date Due from PDF
    const dueDateMatch = pdfText.match(/Date\s+Due\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (dueDateMatch) {
      dueDate = dueDateMatch[1];
    }

    console.log('Extracted from PDF:', { invoiceId, totalAmount, dueDate });

    // Extract line items total from Excel
    let lineItemTotal = 0;
    const lineItems = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      // Try to find amount in row
      const amountMatch = row.find((cell: any) => 
        typeof cell === 'number' || String(cell).match(/^\$?[\d,]+\.?\d*$/)
      );
      
      if (amountMatch) {
        const amount = typeof amountMatch === 'number' 
          ? amountMatch 
          : parseFloat(String(amountMatch).replace(/[$,]/g, ''));
        
        if (!isNaN(amount) && amount > 0) {
          lineItemTotal += amount;
          lineItems.push({ row_number: i, amount });
        }
      }
    }

    console.log(`Extracted ${lineItems.length} line items, line item total: $${lineItemTotal}`);
    
    // Use the header total if available, otherwise use sum of line items
    const finalTotal = totalAmount > 0 ? totalAmount : lineItemTotal;

    const response = {
      ok: true,
      invoice_id: invoiceId || 'WCCP-' + Date.now(),
      status: 'success',
      totals: {
        header_total: finalTotal,
        sum_line_items: lineItemTotal
      }
    };

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
