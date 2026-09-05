import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [SharedModule]
})
export class UsersModule {}
