import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === UserRole.ADMIN;
}

export function isAuthorOrAdmin(user: AuthenticatedUser, authorId: string): boolean {
  return isAdmin(user) || user.id === authorId;
}
