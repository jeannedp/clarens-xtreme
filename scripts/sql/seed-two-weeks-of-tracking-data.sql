-- Seeds ~2 weeks of realistic tracking_logs + event_logs data for the
-- "Zipline" venue's devices/readers (originally queried from production at
-- generation time — update the arrays below if the registry has changed).
-- Also seeds that registry itself (device_types/devices/readers, on
-- conflict do nothing) so this runs standalone against a fresh database
-- created from create-all.sql, not only one already populated from
-- production.
--
-- Devices (all one device type, "Helmet"):
--   DEV-IOT-0010-9A .. DEV-IOT-0017-2H (3 Junior Helmets, 5 Senior Helmets)
-- Readers:
--   RDR-IOT-8843-C7 Zipline Main Gate  (heartbeat urn:epc:id:sgtin:0614141.100001.000000000103)
--   RDR-IOT-8841-A9 Zipline Tree 1     (heartbeat urn:epc:id:sgtin:0614141.100001.000000000101)
--   RDR-IOT-8842-B2 Zipline Tree 2     (heartbeat urn:epc:id:sgtin:0614141.100001.000000000102)
--
-- Ruleset:
--   - Every reader heartbeats once per hour, all day, every day.
--   - Gear (helmet) sessions only occur 10:00-15:00 site-local (SAST,
--     UTC+2) = 08:00-13:00 UTC, per src/lib/time.ts SITE_UTC_OFFSET_HOURS.
--   - A session is 4 pings 10s apart (0/10/20/30s), giving a 30s session
--     under the 15-minute gap threshold the dashboard views use to bucket
--     sessions, so each one collapses into exactly one row in session_logs.
--   - Sessions at a given reader never overlap (one person through the
--     gate/checkpoint at a time) — scheduled on a per-reader timeline with
--     a randomised gap (30s-10min) between sessions.
--   - 2-3 unresolved ("unknown") reads per day, spread across readers.
--     tracking_logs has no raw-epc column for unresolved reads (matching
--     src/actions/save-read.action.ts), so these are just device_id = null
--     rows — there's no way to represent them as distinct phantom tags.
--   - Fridays/Saturdays/Sundays are hotspot days and get materially more
--     sessions per reader than the rest of the week.
--   - Every heartbeat gets a matching event_logs row (event_type 'info');
--     every unknown read gets a matching event_logs row (event_type
--     'error').
--
-- Wrapped in a transaction so you can preview it before committing anything:
-- as pasted, it ends in `rollback;`, so running the whole script as-is is
-- always a safe dry run — check the two counts at the bottom (and query the
-- tables directly if you like, you're inside the open transaction so your
-- own inserts are visible) then let it roll back. When you're happy, flip
-- the `rollback;`/`commit;` lines at the very end and run it again — the
-- fixed seed below means you'll get byte-for-byte the same data.
--
-- Safe to re-run after a commit: it only ever inserts, never deletes.
-- Uncomment the truncate below if you want a clean slate first.
-- truncate table public.tracking_logs, public.event_logs restart identity cascade;

begin;

select setseed(0.42);

-- Registry (device_types, devices, readers) that the tracking_logs/event_logs
-- rows below point to via FK, seeded here too so this script also works
-- standalone against a freshly created database (scripts/sql/create-all.sql)
-- and not only one pulled from production. on conflict do nothing keeps it
-- re-runnable against a database that already has this registry.
do $$
declare
  v_helmet_type_id uuid;
begin
  select device_type_id into v_helmet_type_id
  from public.device_types where device_type_name = 'Helmet';

  if v_helmet_type_id is null then
    v_helmet_type_id := gen_random_uuid();
    insert into public.device_types (device_type_id, device_type_name)
    values (v_helmet_type_id, 'Helmet');
  end if;

  insert into public.devices (device_id, device_name, device_type_id)
  select d.device_id, d.device_name, v_helmet_type_id
  from (values
    ('DEV-IOT-0010-9A', 'Junior Helmet 1'),
    ('DEV-IOT-0011-8B', 'Junior Helmet 2'),
    ('DEV-IOT-0012-7C', 'Junior Helmet 3'),
    ('DEV-IOT-0013-6D', 'Senior Helmet 1'),
    ('DEV-IOT-0014-5E', 'Senior Helmet 2'),
    ('DEV-IOT-0015-4F', 'Senior Helmet 3'),
    ('DEV-IOT-0016-3G', 'Senior Helmet 4'),
    ('DEV-IOT-0017-2H', 'Senior Helmet 5')
  ) as d(device_id, device_name)
  on conflict (device_id) do nothing;

  insert into public.readers (reader_id, reader_name, heartbeat_epc)
  values
    ('RDR-IOT-8843-C7', 'Zipline Main Gate', 'urn:epc:id:sgtin:0614141.100001.000000000103'),
    ('RDR-IOT-8841-A9', 'Zipline Tree 1', 'urn:epc:id:sgtin:0614141.100001.000000000101'),
    ('RDR-IOT-8842-B2', 'Zipline Tree 2', 'urn:epc:id:sgtin:0614141.100001.000000000102')
  on conflict (reader_id) do nothing;
end $$;

do $$
declare
  v_devices     text[] := array[
    'DEV-IOT-0010-9A', 'DEV-IOT-0011-8B', 'DEV-IOT-0012-7C',
    'DEV-IOT-0013-6D', 'DEV-IOT-0014-5E', 'DEV-IOT-0015-4F',
    'DEV-IOT-0016-3G', 'DEV-IOT-0017-2H'
  ];
  v_readers     text[] := array['RDR-IOT-8843-C7', 'RDR-IOT-8841-A9', 'RDR-IOT-8842-B2'];
  v_reader_epcs text[] := array[
    'urn:epc:id:sgtin:0614141.100001.000000000103',
    'urn:epc:id:sgtin:0614141.100001.000000000101',
    'urn:epc:id:sgtin:0614141.100001.000000000102'
  ];

  v_start_date  date := current_date - interval '13 days';
  v_day         date;
  v_dow         int;
  v_is_hotspot  boolean;

  v_reader_idx  int;
  v_hour        int;
  v_event_ts    timestamptz;
  v_received_ts timestamptz;

  v_unknown_budget int;
  v_session_target int;
  v_window_start   timestamptz;
  v_window_end     timestamptz;
  v_cursor         timestamptz;
  v_session_no     int;
  v_device         text;
  v_is_unknown     boolean;
  v_signal         numeric;
  v_offset         int;
begin
  for v_day in
    select generate_series(v_start_date::timestamp, (v_start_date + interval '13 days')::timestamp, interval '1 day')::date
  loop
    v_dow := extract(dow from v_day); -- Sunday = 0 .. Saturday = 6
    v_is_hotspot := v_dow in (0, 5, 6); -- Sun / Fri / Sat

    -- --- heartbeats: every hour, every reader, all day -----------------
    for v_reader_idx in 1..array_length(v_readers, 1) loop
      for v_hour in 0..23 loop
        v_event_ts := (v_day::timestamp + (v_hour || ' hours')::interval) at time zone 'utc';
        v_received_ts := v_event_ts + (floor(random() * 5))::int * interval '1 second';

        insert into public.tracking_logs (reader_id, reader_epc, device_id, average_signal_strength, event_timestamp, received_at)
        values (v_readers[v_reader_idx], v_reader_epcs[v_reader_idx], null, round((40 + random() * 55)::numeric, 1), v_event_ts, v_received_ts);

        insert into public.event_logs (event_type, source, description, created_at)
        values ('info', '/api/v1/reads', 'Heartbeat received from reader ' || v_readers[v_reader_idx], v_received_ts);
      end loop;
    end loop;

    -- --- gear sessions: working hours only (10:00-15:00 site-local) ----
    v_unknown_budget := 2 + floor(random() * 2)::int; -- 2 or 3, shared across this day's readers

    for v_reader_idx in 1..array_length(v_readers, 1) loop
      v_window_start := (v_day::timestamp + interval '8 hours') at time zone 'utc';  -- 10:00 SAST
      v_window_end   := (v_day::timestamp + interval '13 hours') at time zone 'utc'; -- 15:00 SAST
      v_session_target := case
        when v_is_hotspot then 18 + floor(random() * 13)::int -- 18-30
        else 8 + floor(random() * 8)::int                     -- 8-15
      end;
      v_cursor := v_window_start + (floor(random() * 300))::int * interval '1 second';

      for v_session_no in 1..v_session_target loop
        exit when v_cursor + interval '30 seconds' > v_window_end;

        v_is_unknown := v_unknown_budget > 0 and random() < 0.08;
        if v_is_unknown then
          v_device := null;
          v_unknown_budget := v_unknown_budget - 1;
        else
          v_device := v_devices[1 + floor(random() * array_length(v_devices, 1))::int];
        end if;

        v_signal := round((40 + random() * 55)::numeric, 1);

        for v_offset in 0..30 by 10 loop
          v_event_ts := v_cursor + (v_offset || ' seconds')::interval;
          v_received_ts := v_event_ts + (floor(random() * 3))::int * interval '1 second';

          insert into public.tracking_logs (reader_id, reader_epc, device_id, average_signal_strength, event_timestamp, received_at)
          values (v_readers[v_reader_idx], null, v_device, v_signal, v_event_ts, v_received_ts);
        end loop;

        if v_is_unknown then
          insert into public.event_logs (event_type, source, description, created_at)
          values ('error', '/api/v1/reads', 'Unknown gear read at reader ' || v_readers[v_reader_idx], v_received_ts);
        end if;

        -- session duration (30s) + a randomised gap (30s-10min) before the next one
        v_cursor := v_cursor + interval '30 seconds' + (30 + floor(random() * 570))::int * interval '1 second';
      end loop;
    end loop;
  end loop;
end $$;

select count(*) as tracking_logs_count from public.tracking_logs;
select count(*) as event_logs_count from public.event_logs;

-- Defaults to a dry run: as pasted, this discards everything above so a
-- first pass is always safe. Once you're happy with the counts (and
-- anything else you spot-checked), comment out `rollback;` and uncomment
-- `commit;` below, then run the whole script again to persist it — the
-- fixed seed above means you'll get the exact same data.
rollback;
-- commit;
