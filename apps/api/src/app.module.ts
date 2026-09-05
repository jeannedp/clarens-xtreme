import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { ExternalModule } from './external/external.module';
import { HealthCheckModule } from './health-check/health-check.module';
import { UsersModule } from './users/users.module';
import { SharedModule } from './shared/shared.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    HealthCheckModule,
    DevicesModule,
    AuthModule,
    UsersModule,
    AdminModule,
    ExternalModule,
    SharedModule,
  ],
})
export class AppModule {}
