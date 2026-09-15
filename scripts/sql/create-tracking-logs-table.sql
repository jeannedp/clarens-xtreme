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
