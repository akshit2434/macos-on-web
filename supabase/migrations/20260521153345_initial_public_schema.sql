create extension if not exists "pgcrypto";

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration integer,
  device_info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  user_id uuid,
  app_id text,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  duration integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_session_id_idx on public.activity_events(session_id);
create index if not exists activity_events_type_time_idx on public.activity_events(event_type, occurred_at desc);
create index if not exists activity_events_app_time_idx on public.activity_events(app_id, occurred_at desc);

create table if not exists public.captured_photos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  storage_path text not null,
  album_id text not null default 'camera-roll',
  captured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists captured_photos_session_id_idx on public.captured_photos(session_id);
create index if not exists captured_photos_captured_at_idx on public.captured_photos(captured_at desc);

create table if not exists public.music_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  track_id text not null,
  playlist_id text,
  event_type text not null,
  progress numeric,
  duration integer,
  created_at timestamptz not null default now()
);

create index if not exists music_events_track_time_idx on public.music_events(track_id, created_at desc);

create table if not exists public.puzzle_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  puzzle_type text not null,
  level_id text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration integer,
  moves integer not null default 0,
  hints_used integer not null default 0,
  resets integer not null default 0,
  result text not null default 'started',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists puzzle_attempts_type_level_idx on public.puzzle_attempts(puzzle_type, level_id);
create index if not exists puzzle_attempts_session_idx on public.puzzle_attempts(session_id);

create table if not exists public.unlock_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  event_type text not null,
  success boolean not null default false,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists unlock_events_session_time_idx on public.unlock_events(session_id, occurred_at desc);

create table if not exists public.content_state (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id text not null,
  state text not null default 'available',
  unlocked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(content_type, content_id)
);

alter table public.sessions enable row level security;
alter table public.activity_events enable row level security;
alter table public.captured_photos enable row level security;
alter table public.music_events enable row level security;
alter table public.puzzle_attempts enable row level security;
alter table public.unlock_events enable row level security;
alter table public.content_state enable row level security;

create policy "allow anonymous session inserts" on public.sessions
  for insert to anon, authenticated
  with check (true);

create policy "allow anonymous activity inserts" on public.activity_events
  for insert to anon, authenticated
  with check (true);

create policy "allow anonymous captured photo inserts" on public.captured_photos
  for insert to anon, authenticated
  with check (true);

create policy "allow anonymous music event inserts" on public.music_events
  for insert to anon, authenticated
  with check (true);

create policy "allow anonymous puzzle attempt inserts" on public.puzzle_attempts
  for insert to anon, authenticated
  with check (true);

create policy "allow anonymous unlock event inserts" on public.unlock_events
  for insert to anon, authenticated
  with check (true);

create policy "allow anonymous content state inserts" on public.content_state
  for insert to anon, authenticated
  with check (true);

create policy "allow anonymous content state reads" on public.content_state
  for select to anon, authenticated
  using (true);

create policy "allow anonymous content state updates" on public.content_state
  for update to anon, authenticated
  using (true)
  with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos', 'photos', true, 52428800, array['image/jpeg', 'image/png', 'image/webp']),
  ('camera-captures', 'camera-captures', false, 52428800, array['image/jpeg', 'image/png', 'image/webp']),
  ('music', 'music', false, 104857600, array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']),
  ('covers', 'covers', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('voice-notes', 'voice-notes', false, 52428800, array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']),
  ('chat-media', 'chat-media', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('note-attachments', 'note-attachments', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('files', 'files', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'audio/mpeg', 'audio/mp3'])
on conflict (id) do nothing;

create policy "allow public reads for public asset buckets" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('photos', 'covers'));

create policy "allow client uploads to camera captures" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'camera-captures');
