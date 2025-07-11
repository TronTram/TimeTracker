'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { theme } = useTheme();

  return (
    <ClerkProvider
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
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
      }}
    >
      {children}
    </ClerkProvider>
  );
} 