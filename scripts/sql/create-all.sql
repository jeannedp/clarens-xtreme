-- ============================================================
-- create-config-types-table.sql
-- ============================================================
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

-- ============================================================
-- create-device-types-table.sql
-- ============================================================
-- Lookup table for gear categories (e.g. "Helmet"). Referenced by
-- public.devices and surfaced on the dashboard views/filters so rides can
-- be filtered by gear type.
create table if not exists public.device_types (
  device_type_id uuid primary key default gen_random_uuid(),
  device_type_name text not null,
  is_active boolean not null default true
);

alter table public.device_types enable row level security;

-- ============================================================
-- create-readers-table.sql
-- ============================================================
-- Registered RFID readers/checkpoints. reader_id is the reader's own
-- hardware id (e.g. "RDR-IOT-8843-C7"), matched directly against the API
-- payload's readerId in src/actions/save-read.action.ts. heartbeat_epc is
-- the special epc a reader reports on its periodic self-check pings —
-- comparing an incoming read's epc against it is how a heartbeat is told
-- apart from a real gear read.
create table if not exists public.readers (
  reader_id text primary key,
  reader_name text not null,
  heartbeat_epc text not null,
  is_active boolean not null default true
);

alter table public.readers enable row level security;

-- ============================================================
-- create-event-logs-table.sql
-- ============================================================
-- Free-form audit/event log written alongside tracking_logs activity (an
-- 'info' row per heartbeat, an 'error' row per unknown read — see
-- scripts/sql/seed-two-weeks-of-tracking-data.sql) and by
-- src/actions/log-event.action.ts. headers/query capture the originating
-- request for debugging and are nullable since not every event has them.
create table if not exists public.event_logs (
  event_log_id uuid primary key default gen_random_uuid(),
  event_type text not null,
  source text not null,
  description text not null,
  headers jsonb,
  query jsonb,
  created_at timestamptz not null default now()
);

create index if not exists event_logs_created_at_idx on public.event_logs (created_at desc);

alter table public.event_logs enable row level security;

-- ============================================================
-- create-configs-table.sql
-- ============================================================
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

-- ============================================================
-- create-devices-table.sql
-- ============================================================
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

-- ============================================================
-- create-tracking-logs-table.sql
-- ============================================================
-- Raw feed of every RFID read, written by src/actions/save-read.action.ts.
-- Exactly one of the following holds per row:
--   - heartbeat:  reader_epc is set (matches that reader's heartbeat_epc),
--                 device_id is null
--   - known gear: device_id resolved (the epc matched a registered
--                 device), reader_epc is null
--   - unknown:    neither resolved (an unregistered epc was read) —
--                 device_id and reader_epc are both null
-- device_id/reader_id are nullable with ON DELETE SET NULL so historical
-- logs survive deregistering gear/readers. event_timestamp is the reader's
-- own clock (nullable — not every read carries one); received_at is when
-- the row landed here and always has a value.
--
-- This is the base table behind every dashboard view (card_totals_logs,
-- session_logs, rides_per_day, rides_per_gear), which all partition by
-- device_id/reader_id ordered by event_timestamp to bucket reads into
-- sessions — hence the composite index below.
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

alter table public.tracking_logs enable row level security;

-- ============================================================
-- create-card-totals-view.sql
-- ============================================================
-- Row-grain view feeding the dashboard's headline cards.
--
-- One row per tracking_log, classified as exactly one of:
--   - heartbeat   (reader_epc matches that reader's heartbeat_epc)
--   - known gear  (device_id and reader_id both resolved, not a heartbeat)
--   - unknown     (not a heartbeat, but device_id and/or reader_id is null)
--
-- Session bucketing for known-gear rows reuses the same device_id/reader_id
-- + gap logic as public.session_logs (gap = the "Session Gap" config,
-- minutes, latest row in public.configs by config_name, defaulting to 15 if
-- unset — keep this in sync with create-session-logs-view.sql), exposed
-- here as session_key so callers can COUNT(DISTINCT session_key) after
-- filtering.
--
-- Intended usage from the dashboard (filter by date range on event_timestamp,
-- reader_id, and/or device_type_id, then aggregate):
--   total sessions   = count(distinct session_key)
--   total gear       = count(distinct device_id) where device_id is not null
--   total heartbeats = count(*) where is_heartbeat
--   total unknown    = count(*) where is_unknown
create or replace view public.card_totals_logs
with (security_invoker = on) as
with session_gap as (
  select coalesce(
    (
      select (c.config_value #>> '{}')::numeric
      from public.configs c
      where c.config_name = 'Session Gap'
      order by c.created_at desc
      limit 1
    ),
    15
  ) * interval '1 minute' as gap
),
logs as (
  select
    tl.tracking_log_id,
    tl.device_id,
    tl.reader_id,
    tl.event_timestamp,
    tl.received_at,
    tl.reader_epc,
    r.heartbeat_epc,
    d.device_type_id,
    lag(tl.event_timestamp) over (
      partition by tl.device_id, tl.reader_id
      order by tl.event_timestamp
    ) as prev_event_timestamp
  from public.tracking_logs tl
  left join public.readers r on r.reader_id = tl.reader_id
  left join public.devices d on d.device_id = tl.device_id
),
sessions as (
  select
    l.*,
    (l.reader_epc is not null and l.reader_epc = l.heartbeat_epc) as is_heartbeat,
    sum(
      case
        when l.device_id is null or l.reader_id is null then 0
        when l.reader_epc is not null and l.reader_epc = l.heartbeat_epc then 0
        when l.prev_event_timestamp is null
          or l.event_timestamp - l.prev_event_timestamp >= (select gap from session_gap)
        then 1
        else 0
      end
    ) over (
      partition by l.device_id, l.reader_id
      order by l.event_timestamp
      rows between unbounded preceding and current row
    ) as session_seq
  from logs l
)
select
  s.tracking_log_id,
  s.event_timestamp,
  s.received_at,
  s.reader_id,
  s.device_id,
  s.device_type_id,
  s.is_heartbeat,
  (not s.is_heartbeat and (s.device_id is null or s.reader_id is null)) as is_unknown,
  case
    when s.is_heartbeat or s.device_id is null or s.reader_id is null then null
    else s.device_id || ':' || s.reader_id || ':' || s.session_seq
  end as session_key
from sessions s;

-- ============================================================
-- create-session-logs-view.sql
-- ============================================================
-- Non-heartbeat tracking logs, enriched with device/reader names and
-- session-derived timestamps.
--
-- A "session" is a run of consecutive logs for the same device+reader pair
-- where no gap between consecutive event_timestamp values is >= the "Session
-- Gap" config (minutes, latest row in public.configs by config_name,
-- defaulting to 15 if unset). session_start/session_end are the
-- event_timestamp bounds of that run; server_start/server_end are the
-- received_at values recorded on the same rows as session_start/session_end
-- (not just min/max(received_at)).
--
-- device_id/reader_id/device_type_id are included (alongside the display
-- names) so the dashboard can filter this view by gear, gear type, and
-- reader the same way it filters card_totals_logs/rides_per_gear.
--
-- Keep this in sync with the identical session-gap logic in
-- create-card-totals-view.sql.
create or replace view public.session_logs
with (security_invoker = on) as
with session_gap as (
  select coalesce(
    (
      select (c.config_value #>> '{}')::numeric
      from public.configs c
      where c.config_name = 'Session Gap'
      order by c.created_at desc
      limit 1
    ),
    15
  ) * interval '1 minute' as gap
),
logs as (
  select
    tl.tracking_log_id,
    tl.device_id,
    tl.reader_id,
    tl.average_signal_strength,
    tl.event_timestamp,
    tl.received_at,
    lag(tl.event_timestamp) over (
      partition by tl.device_id, tl.reader_id
      order by tl.event_timestamp
    ) as prev_event_timestamp
  from public.tracking_logs tl
  where tl.reader_epc is null
    and tl.event_timestamp is not null
),
sessions as (
  select
    l.*,
    sum(
      case
        when l.prev_event_timestamp is null
          or l.event_timestamp - l.prev_event_timestamp >= (select gap from session_gap)
        then 1
        else 0
      end
    ) over (
      partition by l.device_id, l.reader_id
      order by l.event_timestamp
      rows between unbounded preceding and current row
    ) as session_seq
  from logs l
)
select
  s.device_id,
  d.device_name,
  d.device_type_id,
  s.reader_id,
  r.reader_name,
  s.average_signal_strength as signal_strength,
  first_value(s.event_timestamp) over w as session_start,
  last_value(s.event_timestamp) over w as session_end,
  first_value(s.received_at) over w as server_start,
  last_value(s.received_at) over w as server_end
from sessions s
join public.devices d on d.device_id = s.device_id
join public.readers r on r.reader_id = s.reader_id
window w as (
  partition by s.device_id, s.reader_id, s.session_seq
  order by s.event_timestamp
  rows between unbounded preceding and unbounded following
);

-- ============================================================
-- create-settings-view.sql
-- ============================================================
-- Single-row settings view assembled from the configs/config_types tables.
--
-- configs is append-only (one row per change, timestamped by created_at),
-- so this first picks the latest row per (config_type_id, config_name),
-- then nests them into JSON:
--   {
--     "<config_type_name>": {
--       "<config_name>": { "value": <config_value>, "description": <config_description> },
--       ...
--     },
--     ...
--   }
--
-- jsonb_object_agg with no GROUP BY on the outermost query always collapses
-- to exactly one row (an empty object if there are no configs at all,
-- rather than no rows / null).
create or replace view public.settings
with (security_invoker = on) as
with latest_configs as (
  select distinct on (c.config_type_id, c.config_name)
    c.config_type_id,
    c.config_name,
    c.config_value,
    c.config_description
  from public.configs c
  order by c.config_type_id, c.config_name, c.created_at desc
),
per_type as (
  select
    ct.config_type_name,
    jsonb_object_agg(
      lc.config_name,
      jsonb_build_object('value', lc.config_value, 'description', lc.config_description)
    ) as config_values
  from latest_configs lc
  join public.config_types ct on ct.config_type_id = lc.config_type_id
  group by ct.config_type_name
)
select
  coalesce(jsonb_object_agg(pt.config_type_name, pt.config_values), '{}'::jsonb) as settings
from per_type pt;

-- ============================================================
-- create-rides-per-day-view.sql
-- ============================================================
-- One row per calendar day, with the count of rides (sessions, across all
-- hats) that occurred that day. Built on public.card_totals_logs so it
-- shares the same session_key bucketing as public.rides_per_hat.
--
-- Bar graph usage: filter ride_day between :from and :to and plot directly
-- (each row is already one bar).
create or replace view public.rides_per_day
with (security_invoker = on) as
with rides as (
  select
    session_key,
    min(event_timestamp) as session_start
  from public.card_totals_logs
  where session_key is not null
  group by session_key
)
select
  r.session_start::date as ride_day,
  count(*) as rides
from rides r
group by r.session_start::date;

-- ============================================================
-- create-rides-per-gear-view.sql
-- ============================================================
-- One row per gear (device) per reader per calendar day, with the count of
-- rides (sessions) that gear completed at that reader that day. Built on
-- public.card_totals_logs so it shares the same session_key bucketing
-- (device_id/reader_id + 15-minute-gap logic). device_type_id and reader_id
-- are included so the dashboard can filter by gear type and reader, in
-- addition to date range.
--
-- Bar graph usage: filter ride_day between :from and :to (and optionally
-- device_type_id / reader_id), then group/sum by device_id (or device_name)
-- on the client for the selected range.
create or replace view public.rides_per_gear
with (security_invoker = on) as
with rides as (
  select
    session_key,
    device_id,
    reader_id,
    min(event_timestamp) as session_start
  from public.card_totals_logs
  where session_key is not null
  group by session_key, device_id, reader_id
)
select
  r.device_id,
  d.device_name,
  d.device_type_id,
  r.reader_id,
  r.session_start::date as ride_day,
  count(*) as rides
from rides r
join public.devices d on d.device_id = r.device_id
group by r.device_id, d.device_name, d.device_type_id, r.reader_id, r.session_start::date;

