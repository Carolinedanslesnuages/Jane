import { Controller, Delete, Get } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';

@Controller('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  /** The profile of the signed-in user, as known by Jane. */
  @Get()
  profile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    };
  }

  /** Deletes the account and all its data. Irreversible. */
  @Delete()
  deleteAccount(@CurrentUser() user: User) {
    return this.usersService.deleteAccount(user);
  }
}
