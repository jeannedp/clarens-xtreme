import { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

export const SupabaseClientProvider: Provider = {
  provide: SUPABASE_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    configService.changes$.forEach(console.log);
    const supabaseUrl = configService.getOrThrow('SUPABASE_URL');
    const supabasePublishableKey = configService.getOrThrow('SUPABASE_PUBLISHABLE_KEY');
    
    return createClient(
      supabaseUrl,
      supabasePublishableKey,
      { auth: { persistSession: false } }
    );
  }
}