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

    // Parse Excel/CSV file
    const arrayBuffer = await xlsxData.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

    // Clean null bytes from UTF-16 encoded data
    const jsonData = rawData.map(row => 
      row.map(cell => {
        if (typeof cell === 'string') {
          // Remove null bytes and trim
          return cell.replace(/\u0000/g, '').trim();
        }
        return cell;
      })
    );

    console.log(`Parsed ${jsonData.length} rows from Excel`);
    console.log('First 10 rows (cleaned):', JSON.stringify(jsonData.slice(0, 10), null, 2));

    // Extract invoice summary from table structure
    let invoiceId = '';
    let billingDate = '';
    let dueDate = '';
    let totalAmount = 0;

    // Find header row and create column map
    const headerRow = jsonData[0] || [];
    const columnMap: { [key: string]: number } = {};
    headerRow.forEach((header, index) => {
      const cleanHeader = String(header).toLowerCase().trim();
      columnMap[cleanHeader] = index;
    });

    console.log('Column map:', columnMap);

    // Extract invoice ID from first data row (usually row 2)
    const firstDataRow = jsonData.find((row, idx) => idx > 1 && row.length > 5);
    if (firstDataRow && columnMap['invoice'] !== undefined) {
      invoiceId = String(firstDataRow[columnMap['invoice']] || '').trim();
    }

    // Sum up Total column to get amount due
    const totalColIndex = columnMap['total'];
    if (totalColIndex !== undefined) {
      for (let i = 2; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row.length > totalColIndex) {
          const totalCell = String(row[totalColIndex] || '');
          const amount = parseFloat(totalCell.replace(/[$,]/g, ''));
          if (!isNaN(amount)) {
            totalAmount += amount;
          }
        }
      }
    }

    // Look for due date in Bill To column or calculate from data
    const billToColIndex = columnMap['bill to'];
    if (billToColIndex !== undefined && firstDataRow) {
      const billToDate = String(firstDataRow[billToColIndex] || '');
      const dateMatch = billToDate.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      if (dateMatch) {
        // Use the Bill To date as a reference, add 30 days for due date
        const billTo = new Date(dateMatch[0]);
        const due = new Date(billTo);
        due.setDate(due.getDate() + 30);
        dueDate = `${(due.getMonth() + 1).toString().padStart(2, '0')}/${due.getDate().toString().padStart(2, '0')}/${due.getFullYear()}`;
      }
    }

    console.log('Extracted header:', { invoiceId, dueDate, totalAmount });

    // Calculate missing dates
    let finalBillingDate = billingDate;
    let finalDueDate = dueDate;

    if (!billingDate && dueDate) {
      // Calculate billing date as 30 days before due date
      const dueDateObj = new Date(dueDate);
      const billingDateObj = new Date(dueDateObj);
      billingDateObj.setDate(billingDateObj.getDate() - 30);
      finalBillingDate = billingDateObj.toISOString().split('T')[0];
    } else if (billingDate && !dueDate) {
      // Calculate due date as 30 days after billing date
      const billingDateObj = new Date(billingDate);
      const dueDateObj = new Date(billingDateObj);
      dueDateObj.setDate(dueDateObj.getDate() + 30);
      finalDueDate = dueDateObj.toISOString().split('T')[0];
    } else if (!billingDate && !dueDate) {
      // Use defaults
      const today = new Date();
      finalBillingDate = today.toISOString().split('T')[0];
      const defaultDue = new Date(today);
      defaultDue.setDate(defaultDue.getDate() + 30);
      finalDueDate = defaultDue.toISOString().split('T')[0];
    }

    // Extract line items (customize based on WCCP format)
    const lineItems = [];
    let foundDataStart = false;
    let lineItemTotal = 0;

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
            lineItemTotal += amount;
          }
        }

        lineItems.push(lineItem);
      }
    }

    console.log(`Extracted ${lineItems.length} line items, line item total: $${lineItemTotal}`);
    
    // Use the header total if available, otherwise use sum of line items
    const finalTotal = totalAmount > 0 ? totalAmount : lineItemTotal;

    const extractedData = {
      invoice: {
        summary_invoice_id: invoiceId || 'WCCP-' + Date.now(),
        billing_date: finalBillingDate,
        due_date: finalDueDate,
        billing_terms: 'Net 30',
        vendor: 'WCCP',
        currency_code: 'USD',
        amount_due: finalTotal,
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
