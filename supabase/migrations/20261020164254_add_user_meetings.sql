create table public.user_meetings (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document jsonb not null check (jsonb_typeof(document) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_meetings is
  'Tambayayong meeting documents owned by an authenticated user. Guest records remain in IndexedDB.';

create index user_meetings_user_updated_idx
  on public.user_meetings (user_id, updated_at desc);

alter table public.user_meetings enable row level security;

revoke all on table public.user_meetings from anon;
grant select, insert, update, delete on table public.user_meetings to authenticated;

create policy "Users can read their meetings"
  on public.user_meetings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their meetings"
  on public.user_meetings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their meetings"
  on public.user_meetings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their meetings"
  on public.user_meetings
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
