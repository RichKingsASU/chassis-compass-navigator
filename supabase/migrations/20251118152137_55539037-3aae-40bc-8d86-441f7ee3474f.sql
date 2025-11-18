-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create chassis reservations table
CREATE TABLE public.chassis_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chassis_id TEXT NOT NULL REFERENCES chassis_master(forrest_chz_id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_in_time TIME NOT NULL,
  unit_number TEXT,
  account_manager TEXT,
  notes TEXT,
  ssl_size TEXT,
  planned_exit_date DATE,
  reservation_type TEXT,
  eq_type TEXT,
  load_type TEXT,
  booking_number TEXT,
  location TEXT,
  reserved_by TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chassis_reservations ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage reservations
CREATE POLICY "Allow all operations on chassis_reservations"
ON public.chassis_reservations
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX idx_chassis_reservations_chassis_id ON public.chassis_reservations(chassis_id);
CREATE INDEX idx_chassis_reservations_status ON public.chassis_reservations(status);
CREATE INDEX idx_chassis_reservations_check_in_date ON public.chassis_reservations(check_in_date);

-- Trigger for updated_at
CREATE TRIGGER update_chassis_reservations_updated_at
BEFORE UPDATE ON public.chassis_reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.chassis_reservations IS 'Stores chassis reservation information for managed Forrest chassis';