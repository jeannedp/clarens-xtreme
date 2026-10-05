-- ----------------------------------------------------------- --

create table if not exists public.settings (
  setting_id uuid primary key default gen_random_uuid(),
  setting_name text not null,
  session_gap int not null default 0,
  heartbeat_stale int not null default 0,
  heartbeat_offline int not null default 0,
  min_session_duration int not null default 0,
  min_session_reads int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists settings_created_at_idx on public.settings (setting_name);

alter table public.settings enable row level security;

-- ----------------------------------------------------------- --

create table if not exists public.readers (
  reader_id text primary key,
  reader_name text not null,
  heartbeat_epc text not null,
  is_active boolean not null default true,
  setting_id uuid references public.settings (setting_id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists readers_setting_id_idx on public.readers (setting_id);

alter table public.readers enable row level security;

-- ----------------------------------------------------------- --

create table if not exists public.device_types (
  device_type_id uuid primary key default gen_random_uuid(),
  device_type_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.device_types enable row level security;

-- ----------------------------------------------------------- --

create table if not exists public.devices (
  device_id text primary key,
  device_name text not null,
  device_type_id uuid not null references public.device_types (device_type_id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists devices_device_type_id_idx on public.devices (device_type_id);

alter table public.devices enable row level security;

-- ----------------------------------------------------------- --

create table if not exists public.tracking_logs (
  tracking_log_id uuid primary key default gen_random_uuid(),
  device_id text references public.devices (device_id) on delete set null,
  reader_id text references public.readers (reader_id) on delete set null,
  reader_epc text,
  average_signal_strength numeric,
  event_timestamp timestamptz,
  received_at timestamptz not null default now()
);

create index if not exists tracking_logs_device_id_idx on public.tracking_logs (device_id);
create index if not exists tracking_logs_reader_id_idx on public.tracking_logs (reader_id);
create index if not exists tracking_logs_device_reader_event_ts_idx
  on public.tracking_logs (device_id, reader_id, event_timestamp);
create index if not exists tracking_logs_device_reader_received_at_ts_idx
  on public.tracking_logs (device_id, reader_id, received_at);

alter table public.tracking_logs enable row level security;

-- ----------------------------------------------------------- --

create table if not exists public.event_logs (
  event_log_id uuid primary key default gen_random_uuid(),
  event_type text not null,
  source text not null,
  description text not null,
  headers jsonb,
  query jsonb,
  body jsonb,
  created_at timestamptz not null default now()
);

create index if not exists event_logs_created_at_idx 
  on public.event_logs (event_type, created_at desc);

alter table public.event_logs enable row level security;

-- ----------------------------------------------------------- --
