-- ============================================================================
-- Migration: provar_documents_storage
-- Adds storage bucket for Provar automation documents.
-- ============================================================================

begin;

-- Create bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provar-documents',
  'provar-documents',
  false,
  52428800, -- 50MB
  array['application/pdf', 'image/png', 'image/jpeg']::text[]
)
on conflict (id) do nothing;

-- Policies
do $$
declare
  bucket text := 'provar-documents';
begin
  -- SELECT (download) policy
  execute format(
    'drop policy if exists "Authenticated users can read %s" on storage.objects;', bucket
  );
  execute format(
    'create policy "Authenticated users can read %s" on storage.objects for select to authenticated using (bucket_id = %L);',
    bucket, bucket
  );

  -- INSERT (upload) policy
  execute format(
    'drop policy if exists "Authenticated users can upload %s" on storage.objects;', bucket
  );
  execute format(
    'create policy "Authenticated users can upload %s" on storage.objects for insert to authenticated with check (bucket_id = %L);',
    bucket, bucket
  );

  -- UPDATE policy
  execute format(
    'drop policy if exists "Authenticated users can update %s" on storage.objects;', bucket
  );
  execute format(
    'create policy "Authenticated users can update %s" on storage.objects for update to authenticated using (bucket_id = %L);',
    bucket, bucket
  );

  -- DELETE policy
  execute format(
    'drop policy if exists "Authenticated users can delete %s" on storage.objects;', bucket
  );
  execute format(
    'create policy "Authenticated users can delete %s" on storage.objects for delete to authenticated using (bucket_id = %L);',
    bucket, bucket
  );
end;
$$;

commit;
