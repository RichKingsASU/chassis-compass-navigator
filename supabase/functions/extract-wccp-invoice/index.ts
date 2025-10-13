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
    const { pdf_path, xlsx_path } = await req.json();
    console.log("Processing WCCP invoice:", { pdf_path, xlsx_path });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download PDF from storage
    const { data: pdfData, error: pdfError } = await supabase.storage
      .from("wccp-invoices")
      .download(pdf_path);

    if (pdfError) {
      console.error("PDF download error:", pdfError);
      throw new Error(`Failed to download PDF: ${pdfError.message}`);
    }

    // Download Excel from storage
    const { data: xlsxData, error: xlsxError } = await supabase.storage
      .from("wccp-invoices")
      .download(xlsx_path);

    if (xlsxError) {
      console.error("Excel download error:", xlsxError);
      throw new Error(`Failed to download Excel: ${xlsxError.message}`);
    }

    // Parse Excel file
    const arrayBuffer = await xlsxData.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

    console.log(`Parsed ${jsonData.length} rows from Excel`);

    // Extract invoice summary (customize based on WCCP format)
    let invoiceId = '';
    let billingDate = '';
    let dueDate = '';

    // Look for invoice header information
    for (let i = 0; i < Math.min(20, jsonData.length); i++) {
      const row = jsonData[i];
      const rowStr = row.join(' ').toLowerCase();
      
      if (rowStr.includes('invoice') && !invoiceId) {
        invoiceId = row.find((cell: any) => 
          String(cell).match(/^[A-Z0-9]{6,}$/i)
        ) || '';
      }
      
      if (rowStr.includes('billing date') || rowStr.includes('invoice date')) {
        billingDate = row.find((cell: any) => 
          String(cell).match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)
        ) || '';
      }
      
      if (rowStr.includes('due date')) {
        dueDate = row.find((cell: any) => 
          String(cell).match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)
        ) || '';
      }
    }

    // Extract line items (customize based on WCCP format)
    const lineItems = [];
    let foundDataStart = false;
    let totalAmount = 0;

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowStr = row.join(' ').toLowerCase();
      
      // Detect data start
      if (!foundDataStart && (
        rowStr.includes('chassis') || 
        rowStr.includes('container') ||
        rowStr.includes('line item')
      )) {
        foundDataStart = true;
        continue;
      }

      if (foundDataStart && row.length > 5) {
        const lineItem: any = {
          invoice_type: 'USAGE',
          line_invoice_number: invoiceId + '-' + (lineItems.length + 1),
          invoice_status: 'Pending',
          chassis: row[0] || '',
          container_out: row[1] || '',
          date_out: row[2] || '',
          container_in: row[3] || '',
          date_in: row[4] || '',
          invoice_total: 0,
          remaining_balance: 0,
          dispute_status: null,
          attachment_count: 0,
          row_data: row,
        };

        // Try to extract amount
        const amountMatch = row.find((cell: any) => 
          typeof cell === 'number' || String(cell).match(/^\$?[\d,]+\.?\d*$/)
        );
        
        if (amountMatch) {
          const amount = typeof amountMatch === 'number' 
            ? amountMatch 
            : parseFloat(String(amountMatch).replace(/[$,]/g, ''));
          
          if (!isNaN(amount)) {
            lineItem.invoice_total = amount;
            lineItem.remaining_balance = amount;
            totalAmount += amount;
          }
        }

        lineItems.push(lineItem);
      }
    }

    console.log(`Extracted ${lineItems.length} line items, total: $${totalAmount}`);

    const extractedData = {
      invoice: {
        summary_invoice_id: invoiceId || 'WCCP-' + Date.now(),
        billing_date: billingDate || new Date().toISOString().split('T')[0],
        due_date: dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        billing_terms: 'Net 30',
        vendor: 'WCCP',
        currency_code: 'USD',
        amount_due: totalAmount,
        status: 'pending',
      },
      line_items: lineItems,
      attachments: [
        { name: pdf_path.split('/').pop(), path: pdf_path },
        { name: xlsx_path.split('/').pop(), path: xlsx_path },
      ],
      warnings: lineItems.length === 0 
        ? ['No line items found. Please verify the Excel format.']
        : [],
      source_hash: crypto.randomUUID(),
      excel_headers: jsonData[0] || [],
    };

    return new Response(
      JSON.stringify(extractedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing WCCP invoice:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
