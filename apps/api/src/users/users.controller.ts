import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  updateProfileSchema,
  type MeResponse,
  type UpdateProfileRequest,
  type UserProfile,
} from '@repo/api';

import { CurrentUser, type AuthenticatedUser } from '../common/auth.decorators';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** The signed-in user's profile and the workspaces they belong to. */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<MeResponse> {
    return this.users.getMe(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateProfileSchema))
    body: UpdateProfileRequest,
  ): Promise<UserProfile> {
    return this.users.updateProfile(user.id, body);
  }
}
