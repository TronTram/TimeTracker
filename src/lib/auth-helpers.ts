// Authentication utilities and authorization checks
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AuthenticationError, AuthorizationError, NotFoundError } from './errors';
import { prisma } from './prisma';

// =============================================================================
// Authentication Utilities
// =============================================================================

/**
 * Get the current authenticated user from Clerk
 * Throws AuthenticationError if not authenticated
 */
export async function requireAuth() {
  const { userId } = auth();
  
  if (!userId) {
    throw new AuthenticationError('You must be signed in to access this resource');
  }
  
  return userId;
}

/**
 * Get the current user from Clerk with full user object
 * Throws AuthenticationError if not authenticated
 */
export async function requireCurrentUser() {
  const user = await currentUser();
  
  if (!user) {
    throw new AuthenticationError('You must be signed in to access this resource');
  }
  
  return user;
}

/**
 * Get the current user ID, redirect to sign-in if not authenticated
 * Use this in Server Components that need authentication
 */
export async function requireAuthWithRedirect() {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return userId;
}

/**
 * Get the current user ID without throwing (returns null if not authenticated)
 * Use this when authentication is optional
 */
export async function getOptionalAuth() {
  const { userId } = auth();
  return userId || null;
}

// =============================================================================
// Database User Management
// =============================================================================

/**
 * Get or create user in the database based on Clerk user
 * This should be called after successful authentication
 */
export async function getOrCreateUser(clerkUserId: string) {
  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    include: { preferences: true },
  });

  if (user) {
    return user;
  }

  // If user doesn't exist, get data from Clerk and create
  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new AuthenticationError('Unable to retrieve user data');
  }

  // Create user with default preferences
  user = await prisma.user.create({
    data: {
      clerkId: clerkUserId,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
      imageUrl: clerkUser.imageUrl,
      preferences: {
        create: {
          theme: 'system',
          pomodoroWorkDuration: 25,
          pomodoroShortBreakDuration: 5,
          pomodoroLongBreakDuration: 15,
          pomodoroLongBreakInterval: 4,
          soundEnabled: true,
          notificationsEnabled: true,
          autoStartBreaks: false,
          autoStartPomodoros: false,
        },
      },
    },
    include: { preferences: true },
  });

  return user;
}

/**
 * Get current user from database with preferences
 * Throws AuthenticationError if not authenticated
 * Throws NotFoundError if user not found in database
 */
export async function requireDatabaseUser() {
  const clerkUserId = await requireAuth();
  
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    include: { preferences: true },
  });

  if (!user) {
    // Try to create user if it doesn't exist
    return await getOrCreateUser(clerkUserId);
  }

  return user;
}

/**
 * Get current user from database (optional, returns null if not found)
 */
export async function getOptionalDatabaseUser() {
  const clerkUserId = await getOptionalAuth();
  
  if (!clerkUserId) {
    return null;
  }

  return await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    include: { preferences: true },
  });
}

// =============================================================================
// Authorization Utilities
// =============================================================================

/**
 * Check if the current user owns a resource
 * Throws AuthorizationError if not the owner
 */
export async function requireResourceOwnership(
  resourceUserId: string,
  resourceType: string = 'resource'
) {
  const currentUser = await requireDatabaseUser();
  
  if (!currentUser || currentUser.id !== resourceUserId) {
    throw new AuthorizationError(`You don't have permission to access this ${resourceType}`);
  }
  
  return currentUser;
}

/**
 * Check if the current user can access a project
 */
export async function requireProjectAccess(projectId: string) {
  const currentUser = await requireDatabaseUser();
  
  if (!currentUser) {
    throw new AuthenticationError('User not found');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true, name: true },
  });

  if (!project) {
    throw new NotFoundError('Project', projectId);
  }

  if (project.userId !== currentUser.id) {
    throw new AuthorizationError("You don't have permission to access this project");
  }

  return { user: currentUser, project };
}

/**
 * Check if the current user can access a time session
 */
export async function requireSessionAccess(sessionId: string) {
  const currentUser = await requireDatabaseUser();
  
  if (!currentUser) {
    throw new AuthenticationError('User not found');
  }

  const session = await prisma.timeSession.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });

  if (!session) {
    throw new NotFoundError('Session', sessionId);
  }

  if (session.userId !== currentUser.id) {
    throw new AuthorizationError("You don't have permission to access this session");
  }

  return { user: currentUser, session };
}

/**
 * Check if the current user can access a tag
 */
export async function requireTagAccess(tagId: string) {
  const currentUser = await requireDatabaseUser();
  
  if (!currentUser) {
    throw new AuthenticationError('User not found');
  }

  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { userId: true, name: true },
  });

  if (!tag) {
    throw new NotFoundError('Tag', tagId);
  }

  if (tag.userId !== currentUser.id) {
    throw new AuthorizationError("You don't have permission to access this tag");
  }

  return { user: currentUser, tag };
}

// =============================================================================
// Role-based Authorization (Future Extension)
// =============================================================================

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

/**
 * Get user role from Clerk metadata
 */
export async function getUserRole(): Promise<UserRole> {
  const user = await currentUser();
  
  if (!user) {
    throw new AuthenticationError('User not authenticated');
  }

  // Check Clerk public metadata for role
  const role = user.publicMetadata?.role as UserRole;
  return role || UserRole.USER;
}

/**
 * Check if user has required role
 */
export async function requireRole(requiredRole: UserRole) {
  const userRole = await getUserRole();
  
  const roleHierarchy = {
    [UserRole.USER]: 0,
    [UserRole.MODERATOR]: 1,
    [UserRole.ADMIN]: 2,
  };

  if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
    throw new AuthorizationError(`This action requires ${requiredRole} role`);
  }

  return userRole;
}

/**
 * Check if user is admin
 */
export async function requireAdmin() {
  return await requireRole(UserRole.ADMIN);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Safely get user ID from request context
 */
export function getUserIdFromAuth(): string | null {
  try {
    const { userId } = auth();
    return userId;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated (boolean)
 */
export function isAuthenticated(): boolean {
  return getUserIdFromAuth() !== null;
}

/**
 * Get user session info for logging/analytics
 */
export async function getSessionInfo() {
  const clerkUser = await currentUser();
  const userId = getUserIdFromAuth();
  
  return {
    userId,
    email: clerkUser?.emailAddresses[0]?.emailAddress,
    name: clerkUser ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() : null,
    isAuthenticated: !!userId,
    sessionId: clerkUser?.id,
  };
}

/**
 * Validate ownership of multiple resources
 */
export async function validateBatchOwnership(
  resourceType: 'project' | 'session' | 'tag',
  resourceIds: string[]
) {
  const currentUser = await requireDatabaseUser();
  
  if (!currentUser) {
    throw new AuthenticationError('User not found');
  }

  let table: string;
  switch (resourceType) {
    case 'project':
      table = 'project';
      break;
    case 'session':
      table = 'timeSession';
      break;
    case 'tag':
      table = 'tag';
      break;
    default:
      throw new Error(`Invalid resource type: ${resourceType}`);
  }

  // Check if all resources belong to the current user
  const count = await (prisma as any)[table].count({
    where: {
      id: { in: resourceIds },
      userId: currentUser.id,
    },
  });

  if (count !== resourceIds.length) {
    throw new AuthorizationError(
      `You don't have permission to access one or more ${resourceType}s`
    );
  }

  return currentUser;
}
