-- Fix search_path for existing trigger functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.dcli_li_touch_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.dcli_li_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate trigger for ccm_invoice table
CREATE TRIGGER update_ccm_invoice_updated_at
BEFORE UPDATE ON public.ccm_invoice
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Recreate trigger for dcli_invoice_line_item table
CREATE TRIGGER dcli_li_upd_at_trig
BEFORE UPDATE ON public.dcli_invoice_line_item
FOR EACH ROW
EXECUTE FUNCTION public.dcli_li_touch_updated_at();