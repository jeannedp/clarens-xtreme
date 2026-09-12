-- One row per calendar day, with the count of rides (sessions, across all
-- hats) that occurred that day. Built on public.card_totals_logs so it
-- shares the same session_key bucketing as public.rides_per_hat.
--
-- Bar graph usage: filter ride_day between :from and :to and plot directly
-- (each row is already one bar).
create or replace view public.rides_per_day as
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
