-- ============================================================================
-- Migration: provar_automation_tracking
-- Adds tables for tracking on-demand Playwright pull runs and documents.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- provar_pull_runs — tracks individual Playwright job executions
-- ---------------------------------------------------------------------------
create table if not exists public.provar_pull_runs (
  id                    uuid primary key default gen_random_uuid(),
  status                text not null default 'queued', -- queued, running, completed, failed
  portal                text not null default 'all',
  date_range            text,
  triggered_by          uuid references auth.users(id),
  started_at            timestamptz,
  completed_at          timestamptz,
  total_containers      int not null default 0,
  processed_containers  int not null default 0,
  downloaded_pdfs       int not null default 0,
  downloaded_screenshots int not null default 0,
  error_count           int not null default 0,
  error_message         text,
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- provar_documents — metadata for files stored in Supabase Storage
-- ---------------------------------------------------------------------------
create table if not exists public.provar_documents (
  id            uuid primary key default gen_random_uuid(),
  pull_run_id   uuid not null references public.provar_pull_runs(id) on delete cascade,
  portal        text not null,
  container_id  text not null,
  document_type text not null check (document_type in ('pdf', 'screenshot', 'other')),
  file_path     text not null, -- path in the storage bucket
  file_name     text not null,
  mime_type     text,
  source_url    text,
  status        text not null default 'downloaded',
  error_message text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_provar_documents_pull_run_id on public.provar_documents(pull_run_id);
create index if not exists idx_provar_documents_container_id on public.provar_documents(container_id);
create index if not exists idx_provar_documents_portal_container on public.provar_documents(portal, container_id);
create index if not exists idx_provar_pull_runs_status on public.provar_pull_runs(status);
create index if not exists idx_provar_pull_runs_created_at on public.provar_pull_runs(created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
-- Check if the common trigger function exists, otherwise create it
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_provar_pull_runs_updated_at
  before update on public.provar_pull_runs
  for each row
  execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------
alter table public.provar_pull_runs enable row level security;
alter table public.provar_documents enable row level security;

-- For now, allow authenticated users to read everything
create policy "Allow authenticated users to read pull runs"
  on public.provar_pull_runs for select
  to authenticated
  using (true);

create policy "Allow authenticated users to read documents"
  on public.provar_documents for select
  to authenticated
  using (true);

-- Service role will handle inserts/updates
create policy "Allow service role full access to pull runs"
  on public.provar_pull_runs for all
  to service_role
  using (true)
  with check (true);

create policy "Allow service role full access to documents"
  on public.provar_documents for all
  to service_role
  using (true)
  with check (true);

commit;
