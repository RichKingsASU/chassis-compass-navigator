-- Create table for GPS upload metadata
CREATE TABLE IF NOT EXISTS public.gps_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  data_date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  row_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for parsed GPS data
CREATE TABLE IF NOT EXISTS public.gps_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES public.gps_uploads(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  device_id TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  recorded_at TIMESTAMP WITH TIME ZONE,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  battery_level INTEGER,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gps_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
CREATE POLICY "Anyone can insert GPS uploads"
  ON public.gps_uploads FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view GPS uploads"
  ON public.gps_uploads FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can update GPS uploads"
  ON public.gps_uploads FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can insert GPS data"
  ON public.gps_data FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view GPS data"
  ON public.gps_data FOR SELECT
  TO public
  USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_gps_uploads_provider ON public.gps_uploads(provider);
CREATE INDEX idx_gps_uploads_data_date ON public.gps_uploads(data_date);
CREATE INDEX idx_gps_uploads_status ON public.gps_uploads(status);
CREATE INDEX idx_gps_data_upload_id ON public.gps_data(upload_id);
CREATE INDEX idx_gps_data_device_id ON public.gps_data(device_id);
CREATE INDEX idx_gps_data_recorded_at ON public.gps_data(recorded_at);