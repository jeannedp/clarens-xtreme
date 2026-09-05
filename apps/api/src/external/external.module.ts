import { Module } from '@nestjs/common';
import { ExternalController } from './external.controller';
import { ExternalService } from './external.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  controllers: [ExternalController],
  providers: [ExternalService],
  imports: [SharedModule]
})
export class ExternalModule {}
