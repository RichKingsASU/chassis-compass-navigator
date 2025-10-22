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
    const { pdf_path, excel_path, invoice_id } = await req.json();

    console.log("Extracting CCM invoice from:", { pdf_path, excel_path, invoice_id });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let extractedData: any = {
      invoice: {
        invoice_number: invoice_id,
        invoice_date: new Date().toISOString().split("T")[0],
        provider: "CCM",
        total_amount_usd: 0,
        status: "pending",
      },
      line_items: [],
      excel_headers: [],
      attachments: [],
      warnings: [],
      source_hash: `sha256:${crypto.randomUUID()}`,
    };

    // Process PDF if provided (for header information)
    if (pdf_path) {
      try {
        const { data: pdfData, error: pdfError } = await supabase.storage
          .from("ccm-invoices")
          .download(pdf_path);

        if (pdfError) {
          console.error("PDF download failed:", pdfError);
          extractedData.warnings.push(`PDF download failed: ${pdfError.message}`);
        } else {
          console.log("PDF downloaded successfully");
          extractedData.attachments.push({
            name: pdf_path.split("/").pop(),
            path: pdf_path,
            type: "pdf",
          });
        }
      } catch (error) {
        console.error("Error processing PDF:", error);
        extractedData.warnings.push(`PDF processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Process Excel file if provided (for line items)
    if (excel_path) {
      try {
        const { data: excelData, error: excelError } = await supabase.storage
          .from("ccm-invoices")
          .download(excel_path);

        if (excelError) {
          console.error("Excel download failed:", excelError);
          extractedData.warnings.push(`Excel download failed: ${excelError.message}`);
        } else {
          console.log("Excel downloaded successfully, parsing...");

          // Parse Excel file
          const arrayBuffer = await excelData.arrayBuffer();
          const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });

          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

          console.log(`Excel has ${jsonData.length} total rows`);
          console.log("First 10 rows:", JSON.stringify(jsonData.slice(0, 10), null, 2));

          // Extract column headers from first row
          const headers = jsonData[0] as string[];
          console.log("Column headers:", headers);
          extractedData.excel_headers = headers;

          // Extract invoice number from Excel data
          let invoiceNumber = invoice_id; // Default to UUID
          const invoiceNumberHeaders = ['Invoice #', 'Invoice Number', 'Invoice', 'Invoice No'];
          
          // Try to find invoice number from first data row
          if (jsonData.length > 1) {
            const firstDataRow = jsonData[1] as unknown[];
            
            for (const invHeader of invoiceNumberHeaders) {
              const headerIndex = headers.findIndex(h => {
                if (!h) return false;
                const headerStr = String(h).trim().toLowerCase();
                const searchStr = invHeader.toLowerCase();
                return headerStr === searchStr || headerStr.includes(searchStr);
              });
              
              if (headerIndex >= 0 && headerIndex < firstDataRow.length) {
                const cell = firstDataRow[headerIndex];
                if (cell && String(cell).trim()) {
                  invoiceNumber = String(cell).trim();
                  console.log(`Found invoice number at column "${headers[headerIndex]}": ${invoiceNumber}`);
                  break;
                }
              }
            }
          }
          
          console.log(`Using invoice number: ${invoiceNumber}`);
          extractedData.invoice.invoice_number = invoiceNumber;

          // Extract line items from data rows
          const lineItems: Array<Record<string, unknown>> = [];
          let totalAmount = 0;

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as unknown[];

            // Skip empty rows
            if (!row || row.length === 0 || row.every((cell) => !cell || String(cell).trim() === "")) {
              continue;
            }

            // Create a row_data object with all columns mapped to their headers
            const rowData: Record<string, unknown> = {};
            headers.forEach((header, index) => {
              if (index < row.length) {
                rowData[header] = row[index];
              }
            });

            // Try to find amount column (common names: Amount, Total, Charge, etc.)
            let amount = 0;
            const amountHeaders = ['Amount', 'Total', 'Charge', 'Amount Due', 'Invoice Amount', 'Total Amount'];
            
            for (const amountHeader of amountHeaders) {
              const headerIndex = headers.findIndex(h => 
                h && h.toLowerCase().includes(amountHeader.toLowerCase())
              );
              
              if (headerIndex >= 0 && headerIndex < row.length) {
                const cell = row[headerIndex];
                const parsedAmount = typeof cell === 'number' 
                  ? cell 
                  : parseFloat(String(cell).replace(/[$,]/g, ''));
                
                if (!isNaN(parsedAmount) && parsedAmount > 0) {
                  amount = parsedAmount;
                  break;
                }
              }
            }

            if (amount > 0) {
              totalAmount += amount;
            }

            lineItems.push({
              row_number: i,
              amount: amount,
              row_data: rowData,
            });

            console.log(`Added line item ${lineItems.length} (row ${i}):`, { amount, rowData });
          }

          extractedData.line_items = lineItems;
          extractedData.invoice.total_amount_usd = totalAmount;

          console.log(`Extracted ${lineItems.length} line items with total amount: $${totalAmount}`);

          extractedData.attachments.push({
            name: excel_path.split("/").pop(),
            path: excel_path,
            type: "excel",
          });
        }
      } catch (error) {
        console.error("Error processing Excel:", error);
        extractedData.warnings.push(`Excel processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log("Extraction completed:", {
      invoice_id: extractedData.invoice.invoice_number,
      line_items_count: extractedData.line_items.length,
      total_amount: extractedData.invoice.total_amount_usd,
      warnings_count: extractedData.warnings.length,
    });

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in extract-ccm-invoice:", error);
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
