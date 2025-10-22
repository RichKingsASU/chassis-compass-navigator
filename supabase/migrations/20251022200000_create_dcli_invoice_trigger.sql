-- Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function that will be triggered on new storage object inserts
CREATE OR REPLACE FUNCTION public.handle_dcli_invoice_upload()
RETURNS TRIGGER AS $$
DECLARE
    edge_function_url TEXT := 'https://fucvkmsaappphsvuabos.supabase.co/functions/v1/dcli-ingest-invoice';
BEGIN
    -- Make an HTTP POST request to the Edge Function
    PERFORM net.http_post(
        url => edge_function_url,
        headers => jsonb_build_object(
            'Content-Type', 'application/json'
        ),
        body => jsonb_build_object(
            'storagePath', NEW.name,
            'filename', NEW.path_tokens[array_length(NEW.path_tokens, 1)],
            'mimeType', NEW.metadata->>'mimetype',
            'userId', NEW.owner
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the storage.objects table
CREATE TRIGGER on_dcli_invoice_upload
AFTER INSERT ON storage.objects
FOR EACH ROW
WHEN (NEW.bucket_id = 'invoices' AND NEW.path_tokens[1] = 'dcli')
EXECUTE FUNCTION public.handle_dcli_invoice_upload();
