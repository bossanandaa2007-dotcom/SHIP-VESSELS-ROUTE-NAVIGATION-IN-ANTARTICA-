-- Public (anon) read access for the tables this dashboard queries directly
-- with the Supabase anon key. This app has no login flow, so any table
-- with RLS enabled and no SELECT policy silently returns zero rows to the
-- anon client (PostgREST responds 200 with an empty array, not an error)
-- even though the data genuinely exists — this is why the icebergs legend
-- reads "(0)" despite 5 real rows in the table, and why every other panel
-- shows "no data" once the tables are populated.

grant select on ships, ship_positions, weather_snapshots, ice_snapshots, icebergs
  to anon, authenticated;

alter table icebergs enable row level security;
drop policy if exists "Public read access" on icebergs;
create policy "Public read access" on icebergs for select using (true);

alter table ship_positions enable row level security;
drop policy if exists "Public read access" on ship_positions;
create policy "Public read access" on ship_positions for select using (true);

alter table weather_snapshots enable row level security;
drop policy if exists "Public read access" on weather_snapshots;
create policy "Public read access" on weather_snapshots for select using (true);

alter table ice_snapshots enable row level security;
drop policy if exists "Public read access" on ice_snapshots;
create policy "Public read access" on ice_snapshots for select using (true);

-- ships already has RLS enabled with an owner-only "for all" policy
-- (schema.sql), which blocks anon SELECT too since nothing can log in yet.
-- Add a permissive read-only policy alongside it; inserts/updates/deletes
-- stay gated to the existing owner-only policy.
drop policy if exists "Public read access" on ships;
create policy "Public read access" on ships for select using (true);
