-- This can be executed in the Supabase SQL editor

create table if not exists public.poll_users (
    id uuid default gen_random_uuid() primary key,
    poll_code text not null,
    username text not null,
    created_at timestamp with time zone default now(),
    
    -- Create a unique constraint on poll_code and username
    unique(poll_code, username)
);

-- Set up row level security
alter table public.poll_users enable row level security;

-- Create policies
create policy "Allow public read access" 
on public.poll_users for select 
using (true);

create policy "Allow authenticated insert"
on public.poll_users for insert
to authenticated, anon
using (true);
