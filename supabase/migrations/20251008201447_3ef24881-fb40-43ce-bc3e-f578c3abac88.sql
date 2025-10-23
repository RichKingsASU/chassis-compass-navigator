-- Add column_headers column to trac_invoice_data table
ALTER TABLE trac_invoice_data 
ADD COLUMN IF NOT EXISTS column_headers jsonb;