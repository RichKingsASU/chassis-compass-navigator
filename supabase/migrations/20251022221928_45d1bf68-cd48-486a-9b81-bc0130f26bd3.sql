-- Create pgvector extension if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Create function to match invoice lines using embeddings
CREATE OR REPLACE FUNCTION match_invoice_lines(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  match_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  line_id bigint,
  invoice_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    invoice_line_embeddings.line_id,
    invoice_line_embeddings.invoice_id,
    invoice_line_embeddings.content,
    1 - (invoice_line_embeddings.embedding <=> query_embedding) as similarity
  FROM invoice_line_embeddings
  WHERE 1 - (invoice_line_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY invoice_line_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Set up cron job to build embeddings hourly (requires pg_cron extension)
-- Uncomment the following lines if you want automatic hourly embedding generation:
-- 
-- SELECT cron.schedule(
--   'build-embeddings-hourly',
--   '0 * * * *', -- Every hour
--   $$
--   SELECT net.http_post(
--     url:='https://fucvkmsaappphsvuabos.supabase.co/functions/v1/build-embeddings',
--     headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Y3ZrbXNhYXBwcGhzdnVhYm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3Mzg1OTcsImV4cCI6MjA3MzMxNDU5N30.zGnrRCzrWbFY-tvXjsb6nf9nVmRhqlEAcdtilRaJPxQ"}'::jsonb
--   ) as request_id;
--   $$
-- );