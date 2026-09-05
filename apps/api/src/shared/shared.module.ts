import { Module } from '@nestjs/common';
import { SupabaseClientProvider } from './providers/supabase-client.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [SupabaseClientProvider],
  exports: [SupabaseClientProvider],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    })
  ]
})
export class SharedModule {}
