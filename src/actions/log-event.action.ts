import { createAdminClient } from "@/utils/supabase/admin";

export interface LogEvent {
  type: 'info' | 'error';
  source: string;
  description: string;
  query: any;
  headers: any;
}

export async function logEvent(logEvent: LogEvent) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("event_logs").insert({
    event_type: logEvent.type,
    source: logEvent.source,
    description: logEvent.description,
    query: logEvent.query,
    headers: logEvent.headers,
  });

  if (error) {
    console.error("logEvent:", error);
  }
}
