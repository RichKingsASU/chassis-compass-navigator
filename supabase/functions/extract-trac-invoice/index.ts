import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdf_path, excel_path, invoice_id } = await req.json();

    console.log("Extracting TRAC invoice from:", { pdf_path, excel_path, invoice_id });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let extractedData: any = {
      invoice: {
        invoice_number: invoice_id,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: null,
        provider: "TRAC",
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
          .from("trac-invoices")
          .download(pdf_path);

        if (pdfError) {
          console.error("PDF download failed:", pdfError);
          extractedData.warnings.push(`PDF download failed: ${pdfError.message}`);
        } else {
          console.log("PDF downloaded successfully");
          
          // Try to extract invoice date and due date from PDF
          try {
            const pdfText = await pdfData.text();
            console.log("PDF text length:", pdfText.length);
            
            // Helper function to parse date strings
            const parseDate = (dateStr: string): string | null => {
              const dateParts = dateStr.split(/[-\/]/);
              if (dateParts.length === 3) {
                let day = dateParts[0];
                let month = dateParts[1];
                let year = dateParts[2];
                
                // Handle month names
                const monthMap: Record<string, string> = {
                  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                  'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
                  'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
                };
                
                if (isNaN(Number(month))) {
                  month = monthMap[month.toLowerCase()] || month;
                }
                
                // Handle 2-digit year
                if (year.length === 2) {
                  year = '20' + year;
                }
                
                // Ensure proper formatting
                day = day.padStart(2, '0');
                month = month.padStart(2, '0');
                
                return `${year}-${month}-${day}`;
              }
              return null;
            };
            
            // Extract Invoice Date
            const invoiceDatePatterns = [
              /Invoice\s+Date[:\s]+(\d{1,2}[-\/]\w{3}[-\/]\d{2,4})/i,
              /Invoice\s+Date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
            ];
            
            for (const pattern of invoiceDatePatterns) {
              const match = pdfText.match(pattern);
              if (match && match[1]) {
                const parsed = parseDate(match[1]);
                if (parsed) {
                  extractedData.invoice.invoice_date = parsed;
                  console.log("Found invoice date:", match[1], "->", parsed);
                  break;
                }
              }
            }
            
            // Extract Due Date
            const dueDatePatterns = [
              /Due\s+Date[:\s]+(\d{1,2}[-\/]\w{3}[-\/]\d{2,4})/i,
              /Due\s+Date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
              /Payment\s+Due[:\s]+(\d{1,2}[-\/]\w{3}[-\/]\d{2,4})/i,
              /Payment\s+Due[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
            ];
            
            for (const pattern of dueDatePatterns) {
              const match = pdfText.match(pattern);
              if (match && match[1]) {
                const parsed = parseDate(match[1]);
                if (parsed) {
                  extractedData.invoice.due_date = parsed;
                  console.log("Found due date:", match[1], "->", parsed);
                  break;
                }
              }
            }
          } catch (textError) {
            console.error("Error extracting text from PDF:", textError);
          }
          
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
          .from("trac-invoices")
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

          // Try to extract invoice number from the first data row
          let extractedInvoiceNumber = invoice_id;
          const firstDataRow = jsonData.length > 1 ? (jsonData[1] as unknown[]) : [];
          
          const invoiceNumberHeaders = ['Invoice Number', 'Invoice #', 'Invoice No', 'Invoice', 'Inv #', 'Invoice ID'];
          
          for (const invHeader of invoiceNumberHeaders) {
            const headerIndex = headers.findIndex(h => 
              h && h.toLowerCase().includes(invHeader.toLowerCase())
            );
            
            if (headerIndex >= 0 && headerIndex < firstDataRow.length) {
              const cell = firstDataRow[headerIndex];
              if (cell && String(cell).trim() !== '') {
                extractedInvoiceNumber = String(cell).trim();
                console.log(`Found invoice number in column "${headers[headerIndex]}": ${extractedInvoiceNumber}`);
                break;
              }
            }
          }

          // Update the invoice number with the extracted value
          extractedData.invoice.invoice_number = extractedInvoiceNumber;

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
    console.error("Error in extract-trac-invoice:", error);
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
