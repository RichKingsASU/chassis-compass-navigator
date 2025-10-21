-- Add status tracking columns to assets table
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS current_status text DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS vin text,
ADD COLUMN IF NOT EXISTS make text,
ADD COLUMN IF NOT EXISTS model text;

-- Enable realtime for assets table
ALTER TABLE public.assets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assets;

-- Create repairs table
CREATE TABLE IF NOT EXISTS public.repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chassis_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  timestamp_utc timestamptz NOT NULL DEFAULT now(),
  cost_usd numeric(10,2) NOT NULL,
  description text NOT NULL,
  repair_status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create tms_load_financials table
CREATE TABLE IF NOT EXISTS public.tms_load_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chassis_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  date_utc date NOT NULL,
  tms_load_id text,
  revenue_usd numeric(10,2) NOT NULL DEFAULT 0,
  fuel_surcharge_usd numeric(10,2) NOT NULL DEFAULT 0,
  accessorials_usd numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create equipment_costs table
CREATE TABLE IF NOT EXISTS public.equipment_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chassis_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  cost_date_utc date NOT NULL,
  cost_type text NOT NULL,
  amount_usd numeric(10,2) NOT NULL,
  period text NOT NULL CHECK (period IN ('one_time', 'daily', 'monthly', 'annual')),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tms_load_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_costs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for repairs
CREATE POLICY "Allow all operations on repairs"
  ON public.repairs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for tms_load_financials
CREATE POLICY "Allow all operations on tms_load_financials"
  ON public.tms_load_financials
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for equipment_costs
CREATE POLICY "Allow all operations on equipment_costs"
  ON public.equipment_costs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_repairs_chassis_id ON public.repairs(chassis_id);
CREATE INDEX IF NOT EXISTS idx_repairs_timestamp ON public.repairs(timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_tms_financials_chassis_id ON public.tms_load_financials(chassis_id);
CREATE INDEX IF NOT EXISTS idx_tms_financials_date ON public.tms_load_financials(date_utc DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_costs_chassis_id ON public.equipment_costs(chassis_id);
CREATE INDEX IF NOT EXISTS idx_equipment_costs_date ON public.equipment_costs(cost_date_utc DESC);