-- ============================================================
-- SafeGround – Supabase Database Schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid references auth.users on delete cascade primary key,
  full_name     text,
  city          text default 'Bengaluru',
  created_at    timestamptz default now()
);

-- Auto-create profile on new user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Checklist Items ─────────────────────────────────────────
create table if not exists checklist_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  task        text not null,
  category    text,
  priority    text default 'Medium',
  estimate    text,
  completed   boolean default false,
  updated_at  timestamptz default now()
);

-- ─── Simulation Runs ─────────────────────────────────────────
create table if not exists simulation_runs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  inputs      jsonb not null,
  results     jsonb not null,
  created_at  timestamptz default now()
);

-- ─── Real-time Alerts ────────────────────────────────────────
create table if not exists alerts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  severity    text not null check (severity in ('LOW','MODERATE','HIGH','CRITICAL')),
  zone        text,
  message     text,
  source      text default 'KSNDMC',
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- Seed alerts with real Bengaluru data
insert into alerts (title, severity, zone, message, source) values
  ('Urban Flooding Risk – Outer Ring Road', 'HIGH', 'Whitefield / Marathahalli', 'Rainfall exceeding 80mm expected in 24h. Bellandur Lake spillover risk. Avoid underpasses and low-lying roads near ORR.', 'KSNDMC'),
  ('Lake Overflow Warning – Varthur', 'MODERATE', 'Varthur / Whitefield East', 'Varthur Lake at 87% capacity. Downstream drains at risk. Residents near Sai Layout advised to stay alert.', 'BBMP'),
  ('Urban Heat Advisory', 'LOW', 'Central Bengaluru', 'Daytime temperatures forecast at 36°C. Stay hydrated. Avoid outdoor activity 12pm–3pm.', 'IMD');

-- ─── Row Level Security ───────────────────────────────────────
alter table profiles enable row level security;
alter table checklist_items enable row level security;
alter table simulation_runs enable row level security;
alter table alerts enable row level security;

-- Profiles: users can only read/update their own
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Checklist: full CRUD on own items
create policy "Users can manage own checklist" on checklist_items
  for all using (auth.uid() = user_id);

-- Simulation runs: full CRUD on own runs
create policy "Users can manage own simulations" on simulation_runs
  for all using (auth.uid() = user_id);

-- Alerts: everyone can read active alerts
create policy "Anyone can read alerts" on alerts
  for select using (is_active = true);

-- Enable realtime for alerts table
alter publication supabase_realtime add table alerts;
