import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Loader2, Timer, BarChart3, Target, Users, Settings } from 'lucide-react';

// =============================================================================
// Loading Skeletons
// =============================================================================

export function TimerSkeleton() {
  return (
    <Card className="p-8 text-center">
      <div className="space-y-6">
        {/* Timer display */}
        <div className="space-y-2">
          <Skeleton className="mx-auto h-4 w-24" />
          <Skeleton className="mx-auto h-20 w-64" />
        </div>
        
        {/* Progress ring placeholder */}
        <div className="flex justify-center">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
        
        {/* Control buttons */}
        <div className="flex justify-center space-x-4">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-24" />
        </div>
        
        {/* Project selector */}
        <Skeleton className="mx-auto h-10 w-48" />
      </div>
    </Card>
  );
}

export function SessionListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ProjectGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AnalyticsChartSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="flex justify-center space-x-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="mt-1 h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function AchievementGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="space-y-3 text-center">
            <Skeleton className="mx-auto h-16 w-16 rounded-full" />
            <Skeleton className="mx-auto h-5 w-24" />
            <Skeleton className="mx-auto h-3 w-32" />
            <Skeleton className="h-2 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// Loading Spinners
// =============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
}

export function ButtonLoadingSpinner() {
  return <LoadingSpinner size="sm" className="mr-2" />;
}

// =============================================================================
// Loading States for Specific Features
// =============================================================================

interface LoadingStateProps {
  message?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function TimerLoadingState({ message = 'Loading timer...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
        <Timer className="h-8 w-8 animate-pulse text-blue-600 dark:text-blue-400" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

export function AnalyticsLoadingState({ message = 'Analyzing your data...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
        <BarChart3 className="h-8 w-8 animate-pulse text-green-600 dark:text-green-400" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

export function ProjectsLoadingState({ message = 'Loading projects...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
        <Target className="h-8 w-8 animate-pulse text-purple-600 dark:text-purple-400" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

export function AchievementsLoadingState({ message = 'Loading achievements...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
        <Target className="h-8 w-8 animate-pulse text-yellow-600 dark:text-yellow-400" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

export function SettingsLoadingState({ message = 'Loading settings...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900/20">
        <Settings className="h-8 w-8 animate-pulse text-gray-600 dark:text-gray-400" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

// =============================================================================
// Generic Loading States
// =============================================================================

export function PageLoadingState({ message = 'Loading...', children }: LoadingStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      {children || (
        <>
          <LoadingSpinner size="lg" className="mb-4 text-blue-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        </>
      )}
    </div>
  );
}

export function InlineLoadingState({ message }: { message?: string }) {
  return (
    <div className="flex items-center space-x-2 py-2">
      <LoadingSpinner size="sm" />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
}

export function OverlayLoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-black/80">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4 text-blue-600" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

// =============================================================================
// Loading State Hook
// =============================================================================

export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [error, setError] = React.useState<string | null>(null);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = React.useCallback((error: string | Error) => {
    setIsLoading(false);
    setError(typeof error === 'string' ? error : error.message);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError: setLoadingError,
  };
}

// =============================================================================
// Loading State Provider
// =============================================================================

interface LoadingContextType {
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
}

const LoadingContext = React.createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [globalLoading, setGlobalLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState('Loading...');

  const value = React.useMemo(
    () => ({
      globalLoading,
      setGlobalLoading,
      loadingMessage,
      setLoadingMessage,
    }),
    [globalLoading, loadingMessage]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {globalLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 text-center dark:bg-gray-800">
            <LoadingSpinner size="lg" className="mb-4 text-blue-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{loadingMessage}</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = React.useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider');
  }
  return context;
}
