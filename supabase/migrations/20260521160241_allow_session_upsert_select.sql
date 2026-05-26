create policy "allow anonymous session reads for logging upserts" on public.sessions
  for select to anon, authenticated
  using (true);
