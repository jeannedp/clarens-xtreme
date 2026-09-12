-- Non-heartbeat tracking logs, enriched with device/reader names and
-- session-derived timestamps.
--
-- A "session" is a run of consecutive logs for the same device+reader pair
-- where no gap between consecutive event_timestamp values is >= 15 minutes.
-- session_start/session_end are the event_timestamp bounds of that run;
-- server_start/server_end are the received_at values recorded on the same
-- rows as session_start/session_end (not just min/max(received_at)).
--
-- device_id/reader_id/device_type_id are included (alongside the display
-- names) so the dashboard can filter this view by gear, gear type, and
-- reader the same way it filters card_totals_logs/rides_per_gear.
create or replace view public.session_logs as
with logs as (
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
