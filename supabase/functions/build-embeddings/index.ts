import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting embedding generation...");

    // Fetch all raw invoice lines that don't have embeddings yet
    const { data: rawLines, error: fetchError } = await supabase
      .from("dcli_invoice_raw")
      .select("*")
      .is("id", null)
      .limit(100);

    if (fetchError) {
      console.error("Error fetching raw lines:", fetchError);
      throw fetchError;
    }

    if (!rawLines || rawLines.length === 0) {
      console.log("No new lines to process");
      return new Response(
        JSON.stringify({ message: "No new lines to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${rawLines.length} lines`);

    let processed = 0;
    let errors = 0;

    for (const line of rawLines) {
      try {
        // Build content string for embedding
        const content = [
          `Invoice: ${line.invoice_number || "N/A"}`,
          `Chassis: ${line.chassis || "N/A"}`,
          `Container: ${line.on_hire_container || line.off_hire_container || "N/A"}`,
          `Amount: $${line.grand_total || 0}`,
          `Dates: ${line.bill_start_date || "N/A"} to ${line.bill_end_date || "N/A"}`,
          `Location: ${line.on_hire_location || "N/A"} to ${line.off_hire_location || "N/A"}`,
          `Days: ${line.tier_1_days || 0}`,
          `Rate: $${line.tier_1_rate || 0}`,
        ].join(" | ");

        // Generate embedding using Lovable AI
        const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: content,
            model: "text-embedding-ada-002",
          }),
        });

        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text();
          console.error(`Embedding API error for line ${line.id}:`, errorText);
          errors++;
          continue;
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Insert into embeddings table
        const { error: insertError } = await supabase
          .from("invoice_line_embeddings")
          .insert({
            invoice_id: line.invoice_id,
            line_id: line.id,
            vendor_id: null,
            content,
            embedding,
          });

        if (insertError) {
          console.error(`Error inserting embedding for line ${line.id}:`, insertError);
          errors++;
        } else {
          processed++;
        }
      } catch (error) {
        console.error(`Error processing line ${line.id}:`, error);
        errors++;
      }
    }

    console.log(`Processed ${processed} embeddings, ${errors} errors`);

    return new Response(
      JSON.stringify({ processed, errors, total: rawLines.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in build-embeddings:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
