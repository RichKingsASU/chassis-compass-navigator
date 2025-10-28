-- Create table for line item comments
CREATE TABLE IF NOT EXISTS public.dcli_line_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  line_invoice_number TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dcli_line_comments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read comments
CREATE POLICY "Anyone can view comments" 
ON public.dcli_line_comments 
FOR SELECT 
USING (true);

-- Create policy to allow authenticated users to insert comments
CREATE POLICY "Authenticated users can create comments" 
ON public.dcli_line_comments 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_dcli_line_comments_line_invoice_number 
ON public.dcli_line_comments(line_invoice_number);