-- ----------------------------------------------------------- --

create or replace function public.get_sessions(p_setting_id uuid default null)
  returns table (
    device_id text,
    device_name text,
    device_type_id uuid,
    device_type_name text,
    reader_id text,
    reader_name text,
    session_start timestamptz,
    session_end timestamptz,
    signal_strength numeric,
    total_reads bigint
  )
  language sql
  stable
  security invoker
  set search_path = ''

  as $$
    with session_gap as (
      select s.session_gap * interval '1 minute' as gap
      from public.settings s
      where s.setting_id = p_setting_id
    ),

    logs as (
      select
        tl.device_id,
        tl.reader_id,
        tl.average_signal_strength,
        tl.received_at as event_timestamp,
        lag(tl.event_timestamp) over (
          partition by tl.device_id, tl.reader_id
          order by tl.event_timestamp
        ) as prev_event_timestamp
      from public.tracking_logs tl
      join public.readers r on r.reader_id = tl.reader_id
      where tl.device_id is not null
        and tl.reader_epc is distinct from r.heartbeat_epc
        and r.setting_id = p_setting_id
    ),

    numbered as (
      select
        l.*,
        sum(
          case
            when l.prev_event_timestamp is null
              or l.event_timestamp - l.prev_event_timestamp > (select gap from session_gap)
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
      d.device_id as device_id,
      d.device_name as device_name,

      dt.device_type_id as device_type_id,
      dt.device_type_name as device_type_name,

      r.reader_id as reader_id,
      r.reader_name as reader_name,

      min(n.event_timestamp) as session_start,
      max(n.event_timestamp) as session_end,
      avg(n.average_signal_strength) as signal_strength,
      count(*) as total_reads
    from numbered n
    join public.devices d on d.device_id = n.device_id
    join public.readers r on r.reader_id = n.reader_id
    join public.device_types dt on dt.device_type_id = d.device_type_id
    group by
      d.device_id, d.device_name,
      dt.device_type_id, dt.device_type_name,
      r.reader_id, r.reader_name,
      n.session_seq;
  $$;

-- ----------------------------------------------------------- --
