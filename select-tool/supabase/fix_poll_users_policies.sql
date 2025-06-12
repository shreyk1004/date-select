-- Quick fix for poll_users RLS policies
-- Execute this in Supabase SQL Editor

-- Drop existing policies for poll_users
drop policy if exists "Allow public read access for poll_users" on public.poll_users;
drop policy if exists "Allow authenticated insert for poll_users" on public.poll_users;
drop policy if exists "Allow delete for poll_users" on public.poll_users;
drop policy if exists "Allow update for poll_users" on public.poll_users;

-- Recreate all poll_users policies
create policy "Allow public read access for poll_users" 
on public.poll_users for select 
to authenticated, anon
using (true);

create policy "Allow authenticated insert for poll_users"
on public.poll_users for insert
to authenticated, anon
with check (true);

create policy "Allow delete for poll_users"
on public.poll_users for delete
to authenticated, anon
using (true);

create policy "Allow update for poll_users"
on public.poll_users for update
to authenticated, anon
using (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'poll_users'; 