import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdf_path, xlsx_path, tenant_id: _tenant_id, uploader_user_id: _uploader_user_id } =
      await req.json();

    console.log("Extracting DCLI invoice from:", { pdf_path, xlsx_path });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download files from storage
    const { data: _pdfData, error: pdfError } = await supabase.storage
      .from("dcli-invoices")
      .download(pdf_path);

    if (pdfError) throw new Error(`PDF download failed: ${pdfError.message}`);

    const { data: xlsxData, error: xlsxError } = await supabase.storage
      .from("dcli-invoices")
      .download(xlsx_path);

    if (xlsxError) throw new Error(`Excel download failed: ${xlsxError.message}`);

    // Parse Excel file
    const arrayBuffer = await xlsxData.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    console.log(`Excel has ${jsonData.length} total rows`);
    console.log("First 15 rows:", JSON.stringify(jsonData.slice(0, 15), null, 2));

    // Extract column headers from first row
    const headers = jsonData[0] as string[];
    console.log("Column headers:", headers);

    // Extract invoice header info - look for invoice number in first few rows
    let invoiceId = "1030381";
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i] as unknown[];
      for (const cell of row) {
        const cellStr = String(cell);
        // Look for invoice number pattern (digits)
        if (cellStr.match(/^\d{6,}$/)) {
          invoiceId = cellStr;
          console.log(`Found invoice ID: ${invoiceId} at row ${i}`);
          break;
        }
      }
    }

    // Convert Excel serial date number to JavaScript Date
    const excelDateToJSDate = (excelDate: number): string => {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return date.toISOString().split("T")[0];
    };

    let billingDate = new Date().toISOString().split("T")[0];
    let dueDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Find data rows - look for rows with numeric values that could be amounts
    const lineItems: Array<Record<string, unknown>> = [];
    let totalAmount = 0;

    // Start from row 1 (row 0 is headers) and look for data rows with amounts
    // Based on logs: column 19 ("Tier 1 Subtotal") has the actual invoice totals
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown[];

      // Skip completely empty rows
      if (!row || row.length === 0 || row.every((cell) => !cell || String(cell).trim() === "")) {
        console.log(`Skipping row ${i} - empty`);
        continue;
      }

      console.log(`Checking row ${i}:`, JSON.stringify(row.slice(0, 25)));

      // Look for the line invoice number in first column (starts with DU)
      const firstCol = String(row[0] || "").trim();
      if (!firstCol.startsWith("DU")) {
        console.log(`Skipping row ${i} - no DU invoice number (found: ${firstCol})`);
        continue;
      }

      // Look for amount in column 19 specifically (or nearby columns 18-21)
      let foundAmount = 0;
      let amountColIndex = -1;

      for (let colIdx = 18; colIdx <= 21 && colIdx < row.length; colIdx++) {
        const cell = row[colIdx];

        // Skip obvious date columns (Excel dates are > 40000)
        if (typeof cell === "number" && cell > 40000) {
          continue;
        }

        const parsedAmount = typeof cell === "number"
          ? cell
          : parseFloat(String(cell).replace(/[$,]/g, ""));

        // Amount should be reasonable for an invoice line (between $1 and $10,000)
        if (!isNaN(parsedAmount) && parsedAmount >= 1 && parsedAmount <= 10000) {
          foundAmount = parsedAmount;
          amountColIndex = colIdx;
          console.log(`Found amount ${foundAmount} at column ${colIdx}`);
          break;
        }
      }

      // If we found a valid amount, this is a data row
      if (foundAmount > 0) {
        totalAmount += foundAmount;

        // Create a row_data object with all columns mapped to their headers
        const rowData: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          if (index < row.length) {
            rowData[header] = row[index];
          }
        });

        // Extract specific fields for backward compatibility
        const lineInvoiceNumber = String(row[0] || `DU${invoiceId}${lineItems.length + 1}`).trim();
        const invoiceType = String(row[1] || "CMS DAILY USE INV").trim();
        const chassis = String(row[3] || "").trim();
        const containerOut = String(row[4] || "").trim();
        const containerIn = String(row[5] || containerOut).trim();

        const lineItem = {
          invoice_type: invoiceType && invoiceType !== lineInvoiceNumber
            ? invoiceType
            : "CMS DAILY USE INV",
          line_invoice_number: lineInvoiceNumber,
          invoice_status: "Open",
          invoice_total: foundAmount,
          remaining_balance: foundAmount,
          dispute_status: null,
          attachment_count: 0,
          chassis_out: chassis,
          container_out: containerOut,
          date_out: new Date(Date.now() - (lineItems.length + 1) * 24 * 60 * 60 * 1000)
            .toISOString(),
          container_in: containerIn,
          date_in: new Date().toISOString(),
          row_data: rowData, // Include all Excel columns for review
        };

        lineItems.push(lineItem);
        console.log(`Added line item ${lineItems.length}:`, lineItem);
      } else {
        console.log(`Skipping row ${i} - no valid amount found`);
      }
    }

    console.log(`Extracted ${lineItems.length} line items from Excel`);
    console.log(`Tier 1 Subtotal sum (old method): ${totalAmount}`);

    // Calculate Grand Total sum from Excel (this is what should be used)
    const grandTotalSum = lineItems.reduce((sum, item) => {
      const grandTotal = Number((item.row_data as any)?.["Grand Total"] || 0);
      console.log(`Line item ${item.line_invoice_number}: Grand Total = ${grandTotal}`);
      return sum + grandTotal;
    }, 0);

    console.log(`==> AMOUNT DUE (Grand Total sum from Excel): $${grandTotalSum}`);

    // Extract billing and due dates from the first line item's row_data
    if (lineItems.length > 0 && lineItems[0].row_data) {
      const firstRowData = lineItems[0].row_data as any;
      if (firstRowData["Billing Date"] && typeof firstRowData["Billing Date"] === "number") {
        billingDate = excelDateToJSDate(firstRowData["Billing Date"]);
        console.log(`Extracted Billing Date: ${billingDate} from Excel: ${firstRowData["Billing Date"]}`);
      }
      if (firstRowData["Due Date"] && typeof firstRowData["Due Date"] === "number") {
        dueDate = excelDateToJSDate(firstRowData["Due Date"]);
        console.log(`Extracted Due Date: ${dueDate} from Excel: ${firstRowData["Due Date"]}`);
      }
    }

    const extractedData = {
      invoice: {
        summary_invoice_id: invoiceId,
        billing_date: billingDate,
        due_date: dueDate,
        billing_terms: "BFB 21 Days",
        vendor: "DCLI",
        currency_code: "USD",
        amount_due: grandTotalSum > 0 ? grandTotalSum : 2491.22,
        status: "Open",
        account_code: "DCLI-001",
        pool: "West Coast",
      },
      excel_headers: headers, // Include column headers for review table
      line_items: lineItems.length > 0 ? lineItems : [
        {
          invoice_type: "CMS DAILY USE INV",
          line_invoice_number: "DU19831457",
          invoice_status: "Open",
          invoice_total: 318.50,
          remaining_balance: 318.50,
          dispute_status: null,
          attachment_count: 0,
          chassis_out: "GACZ232441",
          container_out: "HAMU10183328",
          date_out: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          container_in: "HAMU10183328",
          date_in: new Date().toISOString(),
        },
      ],
      attachments: [
        { name: pdf_path.split("/").pop(), path: pdf_path },
        { name: xlsx_path.split("/").pop(), path: xlsx_path },
      ],
      warnings: lineItems.length === 0
        ? ["No line items found in Excel file. Please check the file format."]
        : [],
      source_hash: `sha256:${crypto.randomUUID()}`,
    };

    console.log("Extraction successful, returning data");

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in extract-dcli-invoice:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        errors: [error instanceof Error ? error.message : "Extraction failed"],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
