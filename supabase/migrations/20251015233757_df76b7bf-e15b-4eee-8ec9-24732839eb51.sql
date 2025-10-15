-- Make the ccm-invoices bucket public to allow uploads
UPDATE storage.buckets 
SET public = true 
WHERE id = 'ccm-invoices';