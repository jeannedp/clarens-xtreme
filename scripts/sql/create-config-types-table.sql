-- Lookup table for the categories configs are grouped under (e.g. a
-- "Session Gap" config lives under a "General" type). public.settings
-- nests configs by config_type_name, so this drives the top-level keys of
-- that JSON. Managed by hand, not through the app UI.
create table if not exists public.config_types (
  config_type_id uuid primary key default gen_random_uuid(),
  config_type_name text not null,
  is_active boolean not null default true
);

alter table public.config_types enable row level security;
