-- Append-only settings history: saving a setting inserts a new row rather
-- than updating in place, so old values stay around for history (see
-- src/actions/update-settings.action.ts). public.settings reads the latest
-- row per (config_type_id, config_name) by created_at as the current value
-- — same logic reused by create-card-totals-view.sql and
-- create-session-logs-view.sql to look up the "Session Gap" config.
create table if not exists public.configs (
  config_id uuid primary key default gen_random_uuid(),
  config_type_id uuid not null references public.config_types (config_type_id),
  config_name text not null,
  config_value jsonb,
  config_description text not null,
  created_at timestamptz not null default now()
);

create index if not exists configs_config_type_id_idx on public.configs (config_type_id);
create index if not exists configs_config_name_created_at_idx on public.configs (config_name, created_at desc);

alter table public.configs enable row level security;
