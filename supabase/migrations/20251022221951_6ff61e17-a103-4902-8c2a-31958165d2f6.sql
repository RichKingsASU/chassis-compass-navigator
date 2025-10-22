-- Fix search_path security warning for match_invoice_lines function
DROP FUNCTION IF EXISTS match_invoice_lines(vector, int, float);

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
SECURITY DEFINER
SET search_path = public
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