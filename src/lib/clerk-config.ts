import { dark } from '@clerk/themes';

/**
 * Clerk configuration for the application
 */
export const clerkConfig = {
  // Appearance customization
  appearance: {
    baseTheme: dark,
    elements: {
      formButtonPrimary: 
        'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200',
      card: 'shadow-lg border border-gray-200 dark:border-gray-700',
      headerTitle: 'text-gray-900 dark:text-white',
      headerSubtitle: 'text-gray-600 dark:text-gray-400',
      socialButtonsBlockButton: 
        'border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors',
      dividerLine: 'bg-gray-200 dark:bg-gray-600',
      formFieldLabel: 'text-gray-700 dark:text-gray-300',
      formFieldInput: 
        'border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
      footerActionLink: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
    },
  },
  
  // Sign-in configuration
  signIn: {
    elements: {
      rootBox: 'mx-auto',
      card: 'shadow-xl border border-gray-200 dark:border-gray-700',
    },
  },
  
  // Sign-up configuration
  signUp: {
    elements: {
      rootBox: 'mx-auto',
      card: 'shadow-xl border border-gray-200 dark:border-gray-700',
    },
  },
  
  // User profile configuration
  userProfile: {
    elements: {
      rootBox: 'mx-auto',
      card: 'shadow-xl border border-gray-200 dark:border-gray-700',
    },
  },
};

/**
 * Custom claims for user roles and permissions
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export interface UserMetadata {
  role: UserRole;
  onboardingCompleted: boolean;
  lastLoginAt?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
    marketingEmails: boolean;
  };
}

/**
 * Helper function to get user role from Clerk user
 */
export function getUserRole(user: any): UserRole {
  return user?.publicMetadata?.role || UserRole.USER;
}

/**
 * Helper function to check if user has role
 */
export function hasRole(user: any, role: UserRole): boolean {
  const userRole = getUserRole(user);
  const roleHierarchy = {
    [UserRole.USER]: 0,
    [UserRole.MODERATOR]: 1,
    [UserRole.ADMIN]: 2,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[role];
}

/**
 * Helper function to check if user completed onboarding
 */
export function hasCompletedOnboarding(user: any): boolean {
  return user?.publicMetadata?.onboardingCompleted || false;
}

/**
 * Helper function to update user metadata
 */
export function createUserMetadata(
  role: UserRole = UserRole.USER,
  onboardingCompleted: boolean = false
): UserMetadata {
  return {
    role,
    onboardingCompleted,
    lastLoginAt: new Date().toISOString(),
    preferences: {
      theme: 'system',
      emailNotifications: true,
      marketingEmails: false,
    },
  };
}

/**
 * Default redirect URLs
 */
export const redirectUrls = {
  signIn: '/dashboard',
  signUp: '/onboarding',
  afterSignIn: '/dashboard',
  afterSignUp: '/onboarding',
  afterSignOut: '/',
};

/**
 * Protected routes configuration
 */
export const protectedRoutes = [
  '/dashboard',
  '/projects',
  '/analytics',
  '/settings',
  '/profile',
  '/onboarding',
];

/**
 * Public routes configuration
 */
export const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/design-system',
  '/api/webhooks/clerk',
];

/**
 * Admin-only routes
 */
export const adminRoutes = [
  '/admin',
  '/admin/users',
  '/admin/analytics',
  '/admin/settings',
]; 