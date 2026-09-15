-- Registered gear. device_id is the tag's own EPC (e.g. "DEV-IOT-0010-9A"),
-- not a generated key: src/actions/save-read.action.ts resolves a read's
-- raw epc straight into tracking_logs.device_id by matching it against
-- this table's primary key.
create table if not exists public.devices (
  device_id text primary key,
  device_name text not null,
  device_type_id uuid not null references public.device_types (device_type_id),
  is_active boolean not null default true
);

create index if not exists devices_device_type_id_idx on public.devices (device_type_id);

alter table public.devices enable row level security;
