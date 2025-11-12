import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import * as XLSX from "npm:xlsx@0.18.5";

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

    console.log("Extracting SCSPA invoice from:", { pdf_path, excel_path, invoice_id });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let extractedData: any = {
      invoice: {
        invoice_number: invoice_id,
        invoice_date: new Date().toISOString().split("T")[0],
        provider: "SCSPA",
        total_amount_usd: 0,
        status: "pending",
      },
      line_items: [],
      excel_headers: [],
      attachments: [],
      warnings: [],
      source_hash: `sha256:${crypto.randomUUID()}`,
    };

    if (pdf_path) {
      try {
        const { data: pdfData, error: pdfError } = await supabase.storage
          .from("scspa-invoices")
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

    if (excel_path) {
      try {
        const { data: excelData, error: excelError } = await supabase.storage
          .from("scspa-invoices")
          .download(excel_path);

        if (excelError) {
          console.error("Excel download failed:", excelError);
          extractedData.warnings.push(`Excel download failed: ${excelError.message}`);
        } else {
          console.log("Excel downloaded successfully, parsing...");

          const arrayBuffer = await excelData.arrayBuffer();
          const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

          console.log(`Excel has ${jsonData.length} total rows`);

          const headers = jsonData[0] as string[];
          console.log("Column headers:", headers);
          extractedData.excel_headers = headers;

          const lineItems: Array<Record<string, unknown>> = [];
          let totalAmount = 0;

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as unknown[];

            if (!row || row.length === 0 || row.every((cell) => !cell || String(cell).trim() === "")) {
              continue;
            }

            const rowData: Record<string, unknown> = {};
            headers.forEach((header, index) => {
              if (index < row.length) {
                rowData[header] = row[index];
              }
            });

            let amount = 0;
            const amountHeaders = ['Amount', 'Total', 'Charge', 'Amount Due', 'Invoice Amount'];
            
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
          }

          extractedData.line_items = lineItems;
          extractedData.invoice.total_amount_usd = totalAmount;

          console.log(`Extracted ${lineItems.length} line items with total: $${totalAmount}`);

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
    });

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in extract-scspa-invoice:", error);
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
