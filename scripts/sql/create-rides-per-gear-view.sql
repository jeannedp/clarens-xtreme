-- One row per gear (device) per calendar day, with the count of rides
-- (sessions) that gear completed that day. Built on public.card_totals_logs
-- so it shares the same session_key bucketing (device_id/reader_id +
-- 15-minute-gap logic). device_type_id is included so the dashboard can
-- filter by gear type in addition to date range.
--
-- Bar graph usage: filter ride_day between :from and :to (and optionally
-- device_type_id), then group/sum by device_id (or device_name) on the
-- client for the selected range.
create or replace view public.rides_per_gear as
with rides as (
  select
    session_key,
    device_id,
    min(event_timestamp) as session_start
  from public.card_totals_logs
  where session_key is not null
  group by session_key, device_id
)
select
  r.device_id,
  d.device_name,
  d.device_type_id,
  r.session_start::date as ride_day,
  count(*) as rides
from rides r
join public.devices d on d.device_id = r.device_id
group by r.device_id, d.device_name, d.device_type_id, r.session_start::date;
