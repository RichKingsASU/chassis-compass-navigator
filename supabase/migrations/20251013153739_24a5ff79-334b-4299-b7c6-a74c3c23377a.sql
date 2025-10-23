-- Create DCLI invoices bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('dcli-invoices', 'dcli-invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Create permissive policies for dcli-invoices bucket (for testing)
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow all uploads to dcli-invoices" ON storage.objects;
  DROP POLICY IF EXISTS "Allow all reads from dcli-invoices" ON storage.objects;
  DROP POLICY IF EXISTS "Allow all updates to dcli-invoices" ON storage.objects;
  DROP POLICY IF EXISTS "Allow all deletes from dcli-invoices" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new permissive policies for dcli-invoices
CREATE POLICY "Allow all uploads to dcli-invoices"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'dcli-invoices');

CREATE POLICY "Allow all reads from dcli-invoices"
ON storage.objects
FOR SELECT
USING (bucket_id = 'dcli-invoices');

CREATE POLICY "Allow all updates to dcli-invoices"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'dcli-invoices');

CREATE POLICY "Allow all deletes from dcli-invoices"
ON storage.objects
FOR DELETE
USING (bucket_id = 'dcli-invoices');