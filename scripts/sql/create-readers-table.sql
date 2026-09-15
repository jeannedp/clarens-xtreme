-- Registered RFID readers/checkpoints. reader_id is the reader's own
-- hardware id (e.g. "RDR-IOT-8843-C7"), matched directly against the API
-- payload's readerId in src/actions/save-read.action.ts. heartbeat_epc is
-- the special epc a reader reports on its periodic self-check pings —
-- comparing an incoming read's epc against it is how a heartbeat is told
-- apart from a real gear read.
create table if not exists public.readers (
  reader_id text primary key,
  reader_name text not null,
  heartbeat_epc text not null,
  is_active boolean not null default true
);

alter table public.readers enable row level security;
