import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MeResponse, UpdateProfileRequest, UserProfile } from '@repo/api';
import { asc, eq, sql } from 'drizzle-orm';

import { isUniqueViolation } from '../common/database-errors';
import { DB, type Database, type DbExecutor } from '../db';
import { users, workspaceMembers, workspaces } from '../db/schema';

export type UserRow = typeof users.$inferSelect;

export type NewAccount = {
  email?: string | null;
  emailVerified?: boolean;
  phone?: string | null;
  phoneVerified?: boolean;
  passwordHash?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
};

@Injectable()
export class UsersService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async findById(
    id: string,
    executor: DbExecutor = this.db,
  ): Promise<UserRow | undefined> {
    const [user] = await executor
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  /** `email` must already be normalized (trimmed, lower-case); matches the `lower(email)` index. */
  async findByEmail(
    email: string,
    executor: DbExecutor = this.db,
  ): Promise<UserRow | undefined> {
    const [user] = await executor
      .select()
      .from(users)
      .where(eq(sql`lower(${users.email})`, email))
      .limit(1);
    return user;
  }

  async findByPhone(
    phone: string,
    executor: DbExecutor = this.db,
  ): Promise<UserRow | undefined> {
    const [user] = await executor
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    return user;
  }

  /**
   * Creates the user, their personal workspace and the owner membership. Call inside a transaction
   * so a failure leaves no half-created account.
   */
  async createWithPersonalWorkspace(
    tx: DbExecutor,
    account: NewAccount,
  ): Promise<UserRow> {
    const now = new Date();
    let user: UserRow | undefined;
    try {
      [user] = await tx
        .insert(users)
        .values({
          email: account.email ?? null,
          emailVerifiedAt: account.emailVerified ? now : null,
          phone: account.phone ?? null,
          phoneVerifiedAt: account.phoneVerified ? now : null,
          passwordHash: account.passwordHash ?? null,
          name: account.name ?? null,
          avatarUrl: account.avatarUrl ?? null,
        })
        .returning();
    } catch (error) {
      if (isUniqueViolation(error, 'users_email_lower_key')) {
        throw new ConflictException(
          'An account with this email already exists.',
        );
      }
      if (isUniqueViolation(error, 'users_phone_key')) {
        throw new ConflictException(
          'An account with this phone number already exists.',
        );
      }
      throw error;
    }
    if (!user) {
      throw new Error('User insert returned no row');
    }

    const firstName = account.name?.trim().split(/\s+/)[0];
    const [workspace] = await tx
      .insert(workspaces)
      .values({
        name: firstName ? `${firstName}'s workspace` : 'Personal',
        kind: 'personal',
        createdBy: user.id,
      })
      .returning({ id: workspaces.id });
    if (!workspace) {
      throw new Error('Workspace insert returned no row');
    }
    await tx
      .insert(workspaceMembers)
      .values({ workspaceId: workspace.id, userId: user.id, role: 'owner' });

    return user;
  }

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const memberships = await this.db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        kind: workspaces.kind,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, userId))
      .orderBy(asc(workspaces.createdAt));

    return { user: toProfile(user), workspaces: memberships };
  }

  async updateProfile(
    userId: string,
    changes: UpdateProfileRequest,
  ): Promise<UserProfile> {
    const [user] = await this.db
      .update(users)
      .set({
        ...(changes.name !== undefined && { name: changes.name }),
        ...(changes.avatarUrl !== undefined && {
          avatarUrl: changes.avatarUrl,
        }),
      })
      .where(eq(users.id, userId))
      .returning();
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return toProfile(user);
  }
}

export function toProfile(user: UserRow): UserProfile {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
    phone: user.phone,
    phoneVerified: user.phoneVerifiedAt !== null,
    name: user.name,
    avatarUrl: user.avatarUrl,
    hasPassword: user.passwordHash !== null,
    createdAt: user.createdAt.toISOString(),
  };
}
