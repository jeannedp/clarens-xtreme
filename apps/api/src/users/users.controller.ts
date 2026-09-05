import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { Permissions } from 'src/shared/decorators/permission.decorator';
import { SupabaseGuard } from 'src/shared/guards/supabase-auth.guard';
import type { UserContext } from 'src/shared/models/user-context.model';
import { UsersService } from './users.service';
import { PermissionGuard } from 'src/shared/guards/permission.guard';

@Controller('users')
@Permissions('view:users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService
  ){}

  @Get("me")
  @UseGuards(SupabaseGuard, PermissionGuard)
  getUser(
    @CurrentUser() currentUser: UserContext
  ) {
    return currentUser;
  }
}
