-- Free-form audit/event log written alongside tracking_logs activity (an
-- 'info' row per heartbeat, an 'error' row per unknown read — see
-- scripts/sql/seed-two-weeks-of-tracking-data.sql) and by
-- src/actions/log-event.action.ts. headers/query capture the originating
-- request for debugging and are nullable since not every event has them.
create table if not exists public.event_logs (
  event_log_id uuid primary key default gen_random_uuid(),
  event_type text not null,
  source text not null,
  description text not null,
  headers jsonb,
  query jsonb,
  created_at timestamptz not null default now()
);

create index if not exists event_logs_created_at_idx on public.event_logs (created_at desc);

alter table public.event_logs enable row level security;
