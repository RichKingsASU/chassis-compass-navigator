-- Create storage bucket for GPS uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gps-uploads',
  'gps-uploads',
  false,
  52428800, -- 50MB limit
  ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Create gps_uploads table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.gps_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  file_paths TEXT[] NOT NULL,
  data_date DATE NOT NULL,
  notes TEXT,
  total_rows INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add uploaded_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'gps_uploads' 
    AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE public.gps_uploads ADD COLUMN uploaded_by UUID;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.gps_uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all GPS uploads" ON public.gps_uploads;
DROP POLICY IF EXISTS "Authenticated users can insert GPS uploads" ON public.gps_uploads;
DROP POLICY IF EXISTS "Anyone can view GPS uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload GPS files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own GPS uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own GPS uploads" ON storage.objects;

-- RLS policies for gps_uploads table
CREATE POLICY "Users can view all GPS uploads"
ON public.gps_uploads
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert GPS uploads"
ON public.gps_uploads
FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

-- Storage policies for gps-uploads bucket
CREATE POLICY "Anyone can view GPS uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gps-uploads');

CREATE POLICY "Authenticated users can upload GPS files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'gps-uploads' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own GPS uploads"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'gps-uploads' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own GPS uploads"
ON storage.objects
FOR DELETE
USING (bucket_id = 'gps-uploads' AND auth.uid() IS NOT NULL);