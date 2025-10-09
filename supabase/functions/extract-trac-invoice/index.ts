import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdf_path } = await req.json();

    console.log("Extracting TRAC invoice number from:", pdf_path);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download PDF from storage
    const { data: pdfData, error: pdfError } = await supabase.storage
      .from("invoice-files")
      .download(pdf_path);

    if (pdfError) {
      console.error("Error downloading PDF:", pdfError);
      throw new Error(`Failed to download PDF: ${pdfError.message}`);
    }

    // Convert PDF to text using pdfjs (basic text extraction)
    const pdfBytes = await pdfData.arrayBuffer();
    const pdfText = await extractTextFromPDF(pdfBytes);
    
    console.log("Extracted PDF text (first 500 chars):", pdfText.substring(0, 500));

    // Extract invoice number using regex patterns
    const invoiceNumber = extractInvoiceNumber(pdfText);

    if (!invoiceNumber) {
      console.warn("Could not extract invoice number from PDF");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not find invoice number in PDF"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully extracted invoice number:", invoiceNumber);

    return new Response(
      JSON.stringify({
        success: true,
        invoice_number: invoiceNumber
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in extract-trac-invoice:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

async function extractTextFromPDF(pdfBytes: ArrayBuffer): Promise<string> {
  // Simple text extraction - looks for text objects in PDF
  const pdfText = new TextDecoder().decode(pdfBytes);
  
  // Extract text between BT (Begin Text) and ET (End Text) operators
  const textMatches = pdfText.matchAll(/BT\s+(.*?)\s+ET/gs);
  let extractedText = '';
  
  for (const match of textMatches) {
    const textContent = match[1];
    // Extract strings between parentheses or angle brackets
    const strings = textContent.matchAll(/\((.*?)\)|<(.*?)>/g);
    for (const str of strings) {
      extractedText += (str[1] || str[2] || '') + ' ';
    }
  }
  
  return extractedText;
}

function extractInvoiceNumber(text: string): string | null {
  // Common patterns for TRAC invoice numbers
  const patterns = [
    /Invoice\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
    /Invoice\s*Number\s*:?\s*([A-Z0-9\-]+)/i,
    /Invoice\s*No\.?\s*:?\s*([A-Z0-9\-]+)/i,
    /Bill\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
    /\bINV[-\s]?([A-Z0-9\-]+)/i,
    /TRAC[-\s]?([A-Z0-9\-]+)/i,
    /#\s*([A-Z0-9]{6,})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const invoiceNum = match[1].trim();
      // Validate it's not too short or just numbers
      if (invoiceNum.length >= 4) {
        return invoiceNum;
      }
    }
  }

  return null;
}
