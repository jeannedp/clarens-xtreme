-- Row-grain view feeding the dashboard's headline cards.
--
-- One row per tracking_log, classified as exactly one of:
--   - heartbeat   (reader_epc matches that reader's heartbeat_epc)
--   - known gear  (device_id and reader_id both resolved, not a heartbeat)
--   - unknown     (not a heartbeat, but device_id and/or reader_id is null)
--
-- Session bucketing for known-gear rows reuses the same device_id/reader_id
-- + 15-minute-gap logic as public.session_logs, exposed here as session_key
-- so callers can COUNT(DISTINCT session_key) after filtering.
--
-- Intended usage from the dashboard (filter by date range on event_timestamp,
-- reader_id, and/or device_type_id, then aggregate):
--   total sessions   = count(distinct session_key)
--   total gear       = count(distinct device_id) where device_id is not null
--   total heartbeats = count(*) where is_heartbeat
--   total unknown    = count(*) where is_unknown
create or replace view public.card_totals_logs as
with logs as (
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
          or l.event_timestamp - l.prev_event_timestamp >= interval '15 minutes'
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
