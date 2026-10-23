-- Nexus core schema: captures (the user's fragments), the links between them, and the ask log.
-- Based on section 5 of Nexus-Feature-List.md. Differences from the spec, on purpose:
--   * HNSW instead of IVFFlat for the embedding index (IVFFlat built on an empty table has useless lists).
--   * captures.summary_source records whether Claude wrote the summary ('ai') or Nexus fell back to a
--     plain extract because no AI provider was configured ('basic'), so the UI never passes one off as the other.
--   * RLS policies wrap auth.uid() in a select so Postgres evaluates it once per query.
--   * nexus_stats() returns aggregate counts only, for the public /stats page, without a service-role key.

create extension if not exists vector with schema extensions;

create table public.captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('youtube', 'url', 'text', 'tweet')),
  source_url text,
  raw_content text not null,
  title text not null,
  summary text not null,
  one_line_takeaway text not null,
  keywords text[] not null default '{}',
  entities text[] not null default '{}',
  embedding extensions.vector(1536),
  summary_source text not null default 'ai' check (summary_source in ('ai', 'basic')),
  created_at timestamptz not null default now()
);

create index captures_user_created_idx on public.captures (user_id, created_at desc);
create index captures_user_source_idx on public.captures (user_id, source_url);
create index captures_embedding_idx on public.captures using hnsw (embedding extensions.vector_cosine_ops);
create index captures_keywords_idx on public.captures using gin (keywords);
create index captures_entities_idx on public.captures using gin (entities);

create table public.capture_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  from_capture_id uuid not null references public.captures(id) on delete cascade,
  to_capture_id uuid not null references public.captures(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (from_capture_id, to_capture_id)
);

create index capture_links_from_idx on public.capture_links (from_capture_id);
create index capture_links_to_idx on public.capture_links (to_capture_id);
create index capture_links_user_idx on public.capture_links (user_id);

create table public.asks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task text not null,
  mode text not null,
  response text,
  used_capture_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index asks_user_created_idx on public.asks (user_id, created_at desc);

-- Row-level security: every row belongs to one user, and only that user can see or change it.
alter table public.captures enable row level security;
alter table public.capture_links enable row level security;
alter table public.asks enable row level security;

create policy "users see own captures" on public.captures for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "users see own links" on public.capture_links for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "users see own asks" on public.asks for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Semantic search over the caller's own captures. Security invoker, so RLS still applies: passing another
-- user's id returns nothing.
create or replace function public.match_captures (
  query_embedding extensions.vector(1536),
  match_threshold float,
  match_count int,
  for_user uuid
)
returns table (
  id uuid,
  type text,
  title text,
  summary text,
  one_line_takeaway text,
  keywords text[],
  entities text[],
  source_url text,
  created_at timestamptz,
  similarity float
)
language sql stable
set search_path = public, extensions
as $$
  select
    c.id, c.type, c.title, c.summary, c.one_line_takeaway,
    c.keywords, c.entities, c.source_url, c.created_at,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.captures c
  where c.user_id = for_user
    and c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- Keyword backup for retrieval: captures whose title, summary, keywords or entities mention any of the
-- terms, best matches first. Security invoker, so it only ever sees the caller's rows.
create or replace function public.keyword_captures (terms text[], match_count int default 8)
returns table (
  id uuid,
  type text,
  title text,
  summary text,
  one_line_takeaway text,
  keywords text[],
  entities text[],
  source_url text,
  created_at timestamptz,
  hits int
)
language sql stable
set search_path = public
as $$
  select * from (
    select
      c.id, c.type, c.title, c.summary, c.one_line_takeaway,
      c.keywords, c.entities, c.source_url, c.created_at,
      (
        select count(*)::int from unnest(terms) t
        where length(t) > 2
          and (c.title || ' ' || c.summary || ' ' || array_to_string(c.keywords, ' ') || ' '
               || array_to_string(c.entities, ' ')) ilike '%' || t || '%'
      ) as hits
    from public.captures c
  ) scored
  where scored.hits > 0
  order by scored.hits desc, scored.created_at desc
  limit match_count;
$$;

-- Aggregate counts for the public /stats page. Security definer so anonymous visitors can read the totals,
-- and nothing else: no ids, no content.
create or replace function public.nexus_stats ()
returns table (users bigint, captures bigint, asks bigint)
language sql stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from auth.users),
    (select count(*) from public.captures),
    (select count(*) from public.asks where response is not null);
$$;

revoke all on function public.nexus_stats () from public;
grant execute on function public.nexus_stats () to anon, authenticated;
