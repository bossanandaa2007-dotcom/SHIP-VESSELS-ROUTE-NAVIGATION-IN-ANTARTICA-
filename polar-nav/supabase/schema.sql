-- Run this in the Supabase SQL editor once, on a fresh project.

create table if not exists ships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mmsi text unique,
  ship_type text,
  owner_id uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists ship_positions (
  id bigint generated always as identity primary key,
  ship_id uuid references ships(id) on delete cascade,
  lat double precision not null,
  lon double precision not null,
  speed_knots numeric,
  heading numeric,
  recorded_at timestamptz not null default now()
);
create index if not exists idx_ship_positions_ship_time
  on ship_positions(ship_id, recorded_at desc);

create table if not exists weather_snapshots (
  id bigint generated always as identity primary key,
  cell_lat numeric not null,
  cell_lon numeric not null,
  wind_speed numeric,
  wave_height numeric,
  storm_flag boolean default false,
  recorded_at timestamptz not null default now()
);

create table if not exists ice_snapshots (
  id bigint generated always as identity primary key,
  cell_lat numeric not null,
  cell_lon numeric not null,
  concentration numeric,
  recorded_at timestamptz not null default now()
);

create table if not exists icebergs (
  id bigint generated always as identity primary key,
  name text,
  lat double precision,
  lon double precision,
  size_km numeric,
  last_seen timestamptz default now()
);

create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  ship_id uuid references ships(id),
  origin_lat double precision,
  origin_lon double precision,
  dest_lat double precision,
  dest_lon double precision,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists route_options (
  id bigint generated always as identity primary key,
  route_id uuid references routes(id) on delete cascade,
  label text,
  path_geojson jsonb,
  risk_score numeric,
  eta_hours numeric,
  recommended boolean default false
);

alter table ships enable row level security;
create policy "Owners manage their ships" on ships
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

alter publication supabase_realtime add table ship_positions;
