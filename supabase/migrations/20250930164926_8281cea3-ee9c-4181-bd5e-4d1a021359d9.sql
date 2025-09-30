-- Ensure search_path is properly set on validation function
ALTER FUNCTION validate_dcli_invoice(TEXT, TEXT, DATE, DATE, JSONB) 
SET search_path = public;

ALTER FUNCTION validate_dcli_invoice(TEXT, TEXT, DATE, DATE, JSONB) 
SECURITY DEFINER;