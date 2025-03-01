-- Execute this in the Supabase SQL Editor to create tables with correct RLS policies

-- First create the poll_users table
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

-- Now create the polls table and related tables
create table if not exists public.polls (
    id uuid default gen_random_uuid() primary key,
    code text unique not null,
    title text not null,
    admin_name text not null,
    admin_token text not null,
    created_at timestamp with time zone default now()
);

-- Create the poll_dates table
create table if not exists public.poll_dates (
    id uuid default gen_random_uuid() primary key,
    poll_code text not null references public.polls(code) on delete cascade,
    date date not null,
    created_at timestamp with time zone default now(),
    unique(poll_code, date)
);

-- Create the poll_responses table to store user availability
create table if not exists public.poll_responses (
    id uuid default gen_random_uuid() primary key,
    poll_code text not null,
    date date not null,
    username text not null,
    available boolean not null default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(poll_code, date, username),
    foreign key (poll_code, username) references public.poll_users(poll_code, username) on delete cascade
);

-- Create the poll_comments table
create table if not exists public.poll_comments (
    id uuid default gen_random_uuid() primary key,
    poll_code text not null,
    date date not null,
    username text not null,
    comment text not null,
    created_at timestamp with time zone default now(),
    foreign key (poll_code, username) references public.poll_users(poll_code, username) on delete cascade
);

-- Set up row level security
alter table public.polls enable row level security;
alter table public.poll_dates enable row level security;
alter table public.poll_responses enable row level security;
alter table public.poll_comments enable row level security;

-- Create RLS policies with correct syntax
-- Note: For INSERT, we must use WITH CHECK instead of USING

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
with check (true);  -- Changed FROM "using (true)" TO "with check (true)"

-- Poll users policies
create policy "Allow public read access for poll_users" 
on public.poll_users for select 
to authenticated, anon
using (true);

create policy "Allow authenticated insert for poll_users"
on public.poll_users for insert
to authenticated, anon
with check (true);  -- Changed FROM "using (true)" TO "with check (true)"

-- Poll dates policies
create policy "Allow public read access for poll_dates" 
on public.poll_dates for select 
to authenticated, anon
using (true);

create policy "Allow insert for poll_dates" 
on public.poll_dates for insert 
to authenticated, anon
with check (true);  -- Changed FROM "using (true)" TO "with check (true)"

create policy "Allow delete for poll_dates" 
on public.poll_dates for delete 
to authenticated, anon
using (true);

-- Poll responses policies
create policy "Allow public read access for poll_responses" 
on public.poll_responses for select 
to authenticated, anon
using (true);

-- Split up 'all' policy into separate policies, using the correct syntax for each
create policy "Allow insert for poll_responses" 
on public.poll_responses for insert 
to authenticated, anon
with check (true);  -- For INSERT we must use WITH CHECK

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
with check (true);  -- Changed FROM "using (true)" TO "with check (true)"
