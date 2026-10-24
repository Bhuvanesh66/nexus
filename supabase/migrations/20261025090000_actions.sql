-- The execution layer: actions Nexus proposes after a hand-off, which the user approves one by one, and which
-- run through Composio in the user's own connected apps. The table doubles as the action log: rows are never
-- deleted by the app, only moved through proposed → approved → done / failed (or dismissed).

create table public.actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ask_id uuid references public.asks(id) on delete set null,
  kind text not null check (kind in ('send_email', 'create_draft', 'create_event')),
  title text not null,
  -- What was proposed, then replaced by exactly what the user approved.
  payload jsonb not null,
  status text not null default 'proposed'
    check (status in ('proposed', 'approved', 'done', 'failed', 'dismissed')),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  executed_at timestamptz
);

create index actions_user_created_idx on public.actions (user_id, created_at desc);
create index actions_ask_idx on public.actions (ask_id);

alter table public.actions enable row level security;

-- Owners read, add and update their own actions. There is deliberately no delete policy: the log stays.
create policy "users read own actions" on public.actions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users add own actions" on public.actions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users update own actions" on public.actions for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
