
import { supabase } from "@/integrations/supabase/client";

interface ParsedExcelData {
  sheetName: string;
  data: Record<string, any>[];
}

/**
 * Parse Excel file content using Supabase Storage and Excel Parsing Function
 * @param file The Excel file to parse
 * @param invoiceId The ID of the invoice related to this Excel file
 */
export async function parseExcelFile(file: File, invoiceId: string): Promise<ParsedExcelData[]> {
  try {
    // For demonstration purposes, we'll simulate parsing with a mocked parser
    // In a real implementation, you would:
    // 1. Upload the file to temporary storage
    // 2. Use a server-side function to parse the Excel file
    // 3. Return the parsed data
    
    // This is a simplified mock implementation
    const result: ParsedExcelData[] = [];
    
    // Simulate reading data from the first sheet
    const sheetName = "Sheet1";
    const rowsCount = Math.floor(Math.random() * 10) + 5; // 5-15 rows
    
    const mockData: Record<string, any>[] = [];
    
    // Generate mock column headers based on common invoice fields
    const headers = [
      "item_id", "description", "quantity", "unit_price", 
      "amount", "tax", "total", "date", "code"
    ];
    
    // Generate mock data for each row
    for (let i = 1; i <= rowsCount; i++) {
      const row: Record<string, any> = {};
      
      headers.forEach(header => {
        if (header === "item_id") row[header] = `ITEM-${1000 + i}`;
        else if (header === "description") row[header] = `Item description ${i}`;
        else if (header === "quantity") row[header] = Math.floor(Math.random() * 10) + 1;
        else if (header === "unit_price") row[header] = (Math.random() * 100 + 10).toFixed(2);
        else if (header === "amount") {
          const qty = row["quantity"] || 1;
          const price = parseFloat(row["unit_price"] || 20);
          row[header] = (qty * price).toFixed(2);
        }
        else if (header === "tax") row[header] = (parseFloat(row["amount"]) * 0.07).toFixed(2);
        else if (header === "total") {
          const amount = parseFloat(row["amount"] || 0);
          const tax = parseFloat(row["tax"] || 0);
          row[header] = (amount + tax).toFixed(2);
        }
        else if (header === "date") {
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 30));
          row[header] = date.toISOString().split('T')[0];
        }
        else if (header === "code") row[header] = `CODE-${String.fromCharCode(65 + i % 26)}${i}`;
        else row[header] = `Value ${i} for ${header}`;
      });
      
      mockData.push(row);
    }
    
    result.push({ sheetName, data: mockData });
    
    // Simulate a second sheet with different data structure
    if (Math.random() > 0.5) {
      const summaryData = [{
        invoice_number: `INV-${Math.floor(Math.random() * 10000)}`,
        invoice_date: new Date().toISOString().split('T')[0],
        subtotal: mockData.reduce((sum, row) => sum + parseFloat(row.amount), 0).toFixed(2),
        tax_total: mockData.reduce((sum, row) => sum + parseFloat(row.tax), 0).toFixed(2),
        grand_total: mockData.reduce((sum, row) => sum + parseFloat(row.total), 0).toFixed(2),
        currency: "USD",
        payment_terms: "Net 30",
        due_date: (() => {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          return date.toISOString().split('T')[0];
        })()
      }];
      
      result.push({ sheetName: "Summary", data: summaryData });
    }
    
    // Save parsed data to the database
    for (const sheet of result) {
      for (const row of sheet.data) {
        try {
          // Fix the TypeScript error by properly typing the table
          const { error } = await supabase
            .from('ccm_invoice_data')
            .insert({
              invoice_id: invoiceId,
              sheet_name: sheet.sheetName,
              row_data: row
            });
          
          if (error) {
            console.error("Error inserting row data:", error);
            
            // Define the interface for the RPC parameters to fix the TypeScript error
            interface InsertInvoiceDataParams {
              p_invoice_id: string;
              p_sheet_name: string;
              p_row_data: Record<string, any>;
            }
            
            // Use the interface to type the parameters correctly
            const { error: rpcError } = await supabase.rpc<void, InsertInvoiceDataParams>(
              'insert_invoice_data',
              { 
                p_invoice_id: invoiceId,
                p_sheet_name: sheet.sheetName,
                p_row_data: row
              } as InsertInvoiceDataParams
            );
            
            if (rpcError) console.error("RPC insert error:", rpcError);
          }
        } catch (insertError) {
          console.error("Exception during data insert:", insertError);
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    throw new Error("Failed to parse Excel file");
  }
}
