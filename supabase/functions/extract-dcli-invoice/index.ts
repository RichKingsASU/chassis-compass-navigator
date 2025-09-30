import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdf_path, xlsx_path, tenant_id, uploader_user_id } = await req.json();
    
    console.log('Extracting DCLI invoice from:', { pdf_path, xlsx_path });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download files from storage
    const { data: pdfData, error: pdfError } = await supabase.storage
      .from('invoices')
      .download(pdf_path);

    if (pdfError) throw new Error(`PDF download failed: ${pdfError.message}`);

    const { data: xlsxData, error: xlsxError } = await supabase.storage
      .from('invoices')
      .download(xlsx_path);

    if (xlsxError) throw new Error(`Excel download failed: ${xlsxError.message}`);

    // Mock extraction logic (in production, use PDF parser and Excel parser)
    // For now, return sample extracted data
    const extractedData = {
      invoice: {
        summary_invoice_id: "1030381",
        billing_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        billing_terms: "BFB 21 Days",
        vendor: "DCLI",
        currency_code: "USD",
        amount_due: 2491.22,
        status: "Open",
        account_code: "DCLI-001",
        pool: "West Coast"
      },
      line_items: [
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
          date_in: new Date().toISOString()
        },
        {
          invoice_type: "CMS DAILY USE INV",
          line_invoice_number: "DU19831458",
          invoice_status: "Open",
          invoice_total: 425.75,
          remaining_balance: 425.75,
          dispute_status: null,
          attachment_count: 0,
          chassis_out: "GACZ232442",
          container_out: "HAMU10183329",
          date_out: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          container_in: "HAMU10183329",
          date_in: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      attachments: [
        { name: pdf_path.split('/').pop(), path: pdf_path },
        { name: xlsx_path.split('/').pop(), path: xlsx_path }
      ],
      warnings: [],
      source_hash: `sha256:${crypto.randomUUID()}`
    };

    console.log('Extraction successful, returning data');

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in extract-dcli-invoice:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        errors: [error instanceof Error ? error.message : 'Extraction failed']
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
