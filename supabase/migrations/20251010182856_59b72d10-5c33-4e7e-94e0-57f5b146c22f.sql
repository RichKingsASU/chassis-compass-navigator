-- Update storage buckets to accept additional file types
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/vnd.ms-outlook',
  'message/rfc822',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/octet-stream'
]
where id in (
  'dcli-invoices',
  'ccm-invoices',
  'trac-invoices',
  'flexivan-invoices',
  'wccp-invoices',
  'scspa-invoices'
);