-- Add attachments column to dcli_invoice_staging table to track all uploaded files
ALTER TABLE dcli_invoice_staging 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN dcli_invoice_staging.attachments IS 'Array of attachment objects: [{ name, path, type, uploaded_at, size_bytes }]';