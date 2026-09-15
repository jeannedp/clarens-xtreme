-- Lookup table for gear categories (e.g. "Helmet"). Referenced by
-- public.devices and surfaced on the dashboard views/filters so rides can
-- be filtered by gear type.
create table if not exists public.device_types (
  device_type_id uuid primary key default gen_random_uuid(),
  device_type_name text not null,
  is_active boolean not null default true
);

alter table public.device_types enable row level security;
