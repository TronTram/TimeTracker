import type { User, UserPreferences } from '@prisma/client';
import type { UserRole } from '@/lib/clerk-config';

/**
 * Extended user type with database preferences
 */
export interface AuthUser extends User {
  preferences: UserPreferences;
}

/**
 * User session data from Clerk
 */
export interface ClerkUserData {
  id: string;
  emailAddresses: Array<{
    emailAddress: string;
    id: string;
  }>;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  publicMetadata: {
    role?: UserRole;
    onboardingCompleted?: boolean;
    lastLoginAt?: string;
  };
  privateMetadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: AuthUser | null;
  clerkUser: ClerkUserData | null;
  userId: string | null;
}

/**
 * Authentication actions
 */
export interface AuthActions {
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPreferences: boolean;
  getPreferences: () => UserPreferences | undefined;
}

/**
 * Complete authentication context
 */
export interface AuthContext extends AuthState, AuthActions {}

/**
 * Sign-in/Sign-up form data
 */
export interface AuthFormData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  rememberMe?: boolean;
}

/**
 * Onboarding form data
 */
export interface OnboardingFormData {
  name: string;
  timeZone: string;
  workStartTime: string;
  workEndTime: string;
  pomodoroPreferences: {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
  };
  notifications: {
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    emailNotifications: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}

/**
 * User preferences update data
 */
export interface UserPreferencesUpdateData {
  theme?: 'light' | 'dark' | 'system';
  pomodoroWorkDuration?: number;
  pomodoroShortBreakDuration?: number;
  pomodoroLongBreakDuration?: number;
  pomodoroLongBreakInterval?: number;
  autoStartBreaks?: boolean;
  autoStartPomodoros?: boolean;
  soundEnabled?: boolean;
  notificationsEnabled?: boolean;
  defaultProjectId?: string | null;
}

/**
 * User profile update data
 */
export interface UserProfileUpdateData {
  name?: string;
  email?: string;
  imageUrl?: string;
}

/**
 * Authentication error types
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Authentication error
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: Record<string, any>;
}

/**
 * Authentication method types
 */
export enum AuthMethod {
  EMAIL_PASSWORD = 'EMAIL_PASSWORD',
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
  APPLE = 'APPLE',
}

/**
 * Authentication provider configuration
 */
export interface AuthProviderConfig {
  method: AuthMethod;
  enabled: boolean;
  displayName: string;
  icon: string;
  order: number;
}

/**
 * Session token data
 */
export interface SessionToken {
  token: string;
  expiresAt: Date;
  userId: string;
  sessionId: string;
}

/**
 * Route protection types
 */
export enum RouteProtectionLevel {
  PUBLIC = 'PUBLIC',
  AUTHENTICATED = 'AUTHENTICATED',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

/**
 * Protected route configuration
 */
export interface ProtectedRouteConfig {
  path: string;
  protection: RouteProtectionLevel;
  redirectTo?: string;
  requiredRole?: UserRole;
}

/**
 * Authentication event types
 */
export enum AuthEventType {
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  SIGN_UP = 'SIGN_UP',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  PREFERENCES_UPDATE = 'PREFERENCES_UPDATE',
}

/**
 * Authentication event data
 */
export interface AuthEvent {
  type: AuthEventType;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
} 