create or replace view public.filters
  with (security_invoker = on) as

    with all_devices as (
      select
        jsonb_agg(json_build_object(
          'id', device_id,
          'name', device_name
        )) as devices
      from public.devices
    ),

    all_device_types as (
      select
        jsonb_agg(json_build_object(
          'id', device_type_id,
          'name', device_type_name
        )) as device_types
      from public.device_types
    ),

    all_readers as (
      select
        jsonb_agg(json_build_object(
          'id', reader_id,
          'name', reader_name
        )) as readers
      from public.readers
    ),

    date_range as (
      select
        json_build_object(
          'min', min(event_timestamp),
          'max', max(event_timestamp)
        ) as dates
      from public.tracking_logs
    )

    select
      coalesce(all_devices.devices, '[]'::jsonb) as devices,
      coalesce(all_device_types.device_types, '[]'::jsonb) as device_types,
      coalesce(all_readers.readers, '[]'::jsonb) as readers,
      date_range.dates
    from date_range
    cross join all_devices
    cross join all_device_types
    cross join all_readers;