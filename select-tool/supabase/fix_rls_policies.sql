-- Execute this in the Supabase SQL Editor to fix the RLS policies

-- First drop the problematic policies
drop policy if exists "Allow public read access for polls" on public.polls;
drop policy if exists "Allow admin to update polls" on public.polls;
drop policy if exists "Allow poll creation" on public.polls;
drop policy if exists "Allow public read access for poll_dates" on public.poll_dates;
drop policy if exists "Allow insert for poll_dates" on public.poll_dates;
drop policy if exists "Allow delete for poll_dates" on public.poll_dates;
drop policy if exists "Allow public read access for poll_responses" on public.poll_responses;
drop policy if exists "Allow insert and update for poll_responses" on public.poll_responses;
drop policy if exists "Allow public read access for poll_comments" on public.poll_comments;
drop policy if exists "Allow insert for poll_comments" on public.poll_comments;
drop policy if exists "Allow public read access" on public.poll_users;
drop policy if exists "Allow authenticated insert" on public.poll_users;

-- Re-create the policies with correct syntax

-- Polls table policies
create policy "Allow public read access for polls" 
on public.polls for select 
to authenticated, anon
using (true);

create policy "Allow admin to update polls" 
on public.polls for update 
to authenticated, anon
using (auth.uid()::text = admin_token);

create policy "Allow poll creation" 
on public.polls for insert 
to authenticated, anon
with check (true);

-- Poll dates policies
create policy "Allow public read access for poll_dates" 
on public.poll_dates for select 
to authenticated, anon
using (true);

create policy "Allow insert for poll_dates" 
on public.poll_dates for insert 
to authenticated, anon
with check (true);

create policy "Allow delete for poll_dates" 
on public.poll_dates for delete 
to authenticated, anon
using (true);

-- Poll responses policies
create policy "Allow public read access for poll_responses" 
on public.poll_responses for select 
to authenticated, anon
using (true);

create policy "Allow insert for poll_responses" 
on public.poll_responses for insert 
to authenticated, anon
with check (true);

create policy "Allow update for poll_responses" 
on public.poll_responses for update 
to authenticated, anon
using (true);

create policy "Allow delete for poll_responses" 
on public.poll_responses for delete 
to authenticated, anon
using (true);

-- Poll comments policies
create policy "Allow public read access for poll_comments" 
on public.poll_comments for select 
to authenticated, anon
using (true);

create policy "Allow insert for poll_comments" 
on public.poll_comments for insert 
to authenticated, anon
with check (true);

-- Poll users policies
create policy "Allow public read access for poll_users" 
on public.poll_users for select 
to authenticated, anon
using (true);

create policy "Allow authenticated insert for poll_users"
on public.poll_users for insert
to authenticated, anon
with check (true);
