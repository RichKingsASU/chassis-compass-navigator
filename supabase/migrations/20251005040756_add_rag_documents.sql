-- Enable extensions if available (no-op if already enabled)
create extension if not exists pgcrypto;
create extension if not exists vector;

-- Helper to detect vector availability
do $$
begin
  if to_regtype('vector') is null then
    raise notice 'pgvector not available; will create embedding as float4[]';
  end if;
end$$;

-- Create table if not exists; choose column type based on vector availability
do $$
begin
  if not exists (select 1 from information_schema.tables
                 where table_schema='public' and table_name='rag_documents') then
    if to_regtype('vector') is not null then
      execute $SQL$
        create table public.rag_documents (
          id uuid primary key default gen_random_uuid(),
          org_id uuid not null references public.orgs(id) on delete cascade,
          source_table text,
          source_pk text,
          content text not null,
          metadata jsonb not null default '{}'::jsonb,
          embedding vector(1536),
          content_hash text generated always as (md5(content)) stored,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          unique (org_id, source_table, source_pk, content_hash)
        );
      $SQL$;
    else
      execute $SQL$
        create table public.rag_documents (
          id uuid primary key default gen_random_uuid(),
          org_id uuid not null references public.orgs(id) on delete cascade,
          source_table text,
          source_pk text,
          content text not null,
          metadata jsonb not null default '{}'::jsonb,
          embedding float4[],
          content_hash text generated always as (md5(content)) stored,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          unique (org_id, source_table, source_pk, content_hash)
        );
      $SQL$;
    end if;
  end if;
end$$;

-- Indexes (guarded)
do $$
begin
  if to_regtype('vector') is not null then
    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname='idx_rag_docs_embedding_cos'
    ) then
      execute 'create index idx_rag_docs_embedding_cos on public.rag_documents using ivfflat (embedding vector_cosine_ops) with (lists=100);';
    end if;
  end if;

  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='idx_rag_docs_org'
  ) then
    execute 'create index idx_rag_docs_org on public.rag_documents(org_id);';
  end if;

  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='idx_rag_docs_meta'
  ) then
    execute 'create index idx_rag_docs_meta on public.rag_documents using gin (metadata);';
  end if;
end$$;

-- RLS
alter table public.rag_documents enable row level security;
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='rag_documents' and policyname='rag_docs_by_org') then
    execute 'drop policy "rag_docs_by_org" on public.rag_documents';
  end if;
  execute $SQL$
    create policy "rag_docs_by_org" on public.rag_documents
    for all using (
      exists (select 1 from public.user_orgs uo where uo.user_id = auth.uid() and uo.org_id = rag_documents.org_id)
    )
    with check (
      exists (select 1 from public.user_orgs uo where uo.user_id = auth.uid() and uo.org_id = rag_documents.org_id)
    );
  $SQL$;
end$$;

-- Optional RPC for vector path
do $$
begin
  if to_regtype('vector') is not null then
    execute $SQL_FUNC$
      create or replace function public.match_rag_docs(
        org uuid,
        query_embedding vector(1536),
        match_count int default 6
      ) returns table (
        source_table text,
        source_pk text,
        content text,
        score float
      ) language plpgsql stable as $BODY$
      begin
        return query
          select d.source_table, d.source_pk, d.content,
                  1 - (d.embedding <=> query_embedding) as score
          from public.rag_documents d
          where d.org_id = org
          order by d.embedding <-> query_embedding
          limit match_count;
      end;
      $BODY$;
    $SQL_FUNC$;
  end if;
end$$;