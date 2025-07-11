'use client';

import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import type { User, UserPreferences } from '@prisma/client';

export interface AuthUser extends User {
  preferences: UserPreferences;
}

export function useAuth() {
  const { user: clerkUser, isLoaded: userLoaded, isSignedIn } = useUser();
  const { 
    userId, 
    isLoaded: authLoaded, 
    signOut 
  } = useClerkAuth();

  const [dbUser, setDbUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from database when Clerk user is available
  useEffect(() => {
    async function loadUser() {
      if (!isSignedIn || !userId || !userLoaded) {
        setDbUser(null);
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const response = await fetch('/api/auth/user');
        
        if (!response.ok) {
          throw new Error('Failed to load user data');
        }

        const userData = await response.json();
        setDbUser(userData);
      } catch (err) {
        console.error('Error loading user:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [isSignedIn, userId, userLoaded]);

  // Sign out function
  const handleSignOut = async () => {
    try {
      await signOut();
      setDbUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!isSignedIn || !userId) return;

    try {
      setError(null);
      const response = await fetch('/api/auth/user');
      
      if (!response.ok) {
        throw new Error('Failed to refresh user data');
      }

      const userData = await response.json();
      setDbUser(userData);
    } catch (err) {
      console.error('Error refreshing user:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh user');
    }
  };

  const isAuthenticated = isSignedIn && !!dbUser;
  const isLoading = loading || !authLoaded || !userLoaded;

  return {
    // Authentication state
    isAuthenticated,
    isLoading,
    error,
    
    // User data
    user: dbUser,
    clerkUser,
    userId,
    
    // Actions
    signOut: handleSignOut,
    refreshUser,
    
    // Helper functions
    hasPreferences: !!dbUser?.preferences,
    getPreferences: () => dbUser?.preferences,
  };
} 