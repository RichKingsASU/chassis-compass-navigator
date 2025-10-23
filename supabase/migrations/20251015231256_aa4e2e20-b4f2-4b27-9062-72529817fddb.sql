-- Update all vendor invoice buckets to allow xlsb files and any other file types
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.binary.macroenabled.12',
  'text/csv',
  'message/rfc822',
  'application/vnd.ms-outlook',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/octet-stream'
]
WHERE id IN ('dcli-invoices', 'flexivan-invoices', 'scspa-invoices', 'trac-invoices', 'wccp-invoices');