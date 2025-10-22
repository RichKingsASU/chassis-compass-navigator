create table if not exists public.staging_file_rows (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  object_name text,
  row_number integer,
  data jsonb,
  inserted_at timestamptz not null default now()
);

create table if not exists public.ingest_files (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  object_name text,
  etag text,
  inserted_at timestamptz not null default now()
);