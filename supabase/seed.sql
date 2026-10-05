-- Local development seed, run by `supabase db reset` after the migrations.
-- Never runs against a linked/remote project (db push does not seed).

-- Default settings row. The views fall back to 0 when settings is empty,
-- which would make every read its own session — so always seed one.
-- Values in minutes, matching the old configs defaults.
insert into public.settings (setting_name, session_gap, heartbeat_stale, heartbeat_offline, min_session_duration, min_session_reads)
values ('Default', 15, 60, 1440, 0, 0);

-- ~2 weeks of tracking data for the "Zipline" venue, ported from
-- scripts/sql/seed-two-weeks-of-tracking-data.sql (see that file for the
-- ruleset) minus its dry-run transaction wrapper.
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

  insert into public.readers (reader_id, reader_name, heartbeat_epc, setting_id)
  select r.reader_id, r.reader_name, r.heartbeat_epc, s.setting_id
  from (values
    ('RDR-IOT-8843-C7', 'Zipline Main Gate', 'urn:epc:id:sgtin:0614141.100001.000000000103'),
    ('RDR-IOT-8841-A9', 'Zipline Tree 1', 'urn:epc:id:sgtin:0614141.100001.000000000101'),
    ('RDR-IOT-8842-B2', 'Zipline Tree 2', 'urn:epc:id:sgtin:0614141.100001.000000000102')
  ) as r(reader_id, reader_name, heartbeat_epc)
  cross join (select setting_id from public.settings where setting_name = 'Default') as s
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

    -- --- device sessions: working hours only (10:00-15:00 site-local) ----
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
          values ('error', '/api/v1/reads', 'Unknown device read at reader ' || v_readers[v_reader_idx], v_received_ts);
        end if;

        -- session duration (30s) + a randomised gap (30s-10min) before the next one
        v_cursor := v_cursor + interval '30 seconds' + (30 + floor(random() * 570))::int * interval '1 second';
      end loop;
    end loop;
  end loop;
end $$;
