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
create or replace view public.settings as
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
