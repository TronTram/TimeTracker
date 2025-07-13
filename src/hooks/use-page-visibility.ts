// Hook to handle timer behavior when tab is not visible

import { useEffect, useState, useCallback, useRef } from 'react';

export interface PageVisibilityState {
  isVisible: boolean;
  wasHidden: boolean;
  hiddenTime: number; // Time spent hidden in seconds
  lastVisibilityChange: Date | null;
}

export interface PageVisibilityCallbacks {
  onVisibilityChange?: (isVisible: boolean) => void;
  onPageHidden?: (hiddenAt: Date) => void;
  onPageVisible?: (visibleAt: Date, hiddenDuration: number) => void;
}

/**
 * Hook to track page visibility and handle timer behavior when tab is not visible
 * This is crucial for maintaining accurate timer state when users switch tabs
 */
export function usePageVisibility(callbacks: PageVisibilityCallbacks = {}) {
  const [state, setState] = useState<PageVisibilityState>({
    isVisible: !document.hidden,
    wasHidden: false,
    hiddenTime: 0,
    lastVisibilityChange: null,
  });

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    const now = new Date();
    
    setState(prevState => {
      let newHiddenTime = prevState.hiddenTime;
      
      if (isVisible && prevState.lastVisibilityChange) {
        // Page became visible - calculate how long it was hidden
        const hiddenDuration = Math.floor(
          (now.getTime() - prevState.lastVisibilityChange.getTime()) / 1000
        );
        newHiddenTime = prevState.hiddenTime + hiddenDuration;
        
        // Call callback for page becoming visible
        callbacksRef.current.onPageVisible?.(now, hiddenDuration);
      } else if (!isVisible) {
        // Page became hidden
        callbacksRef.current.onPageHidden?.(now);
      }
      
      // Call general visibility change callback
      callbacksRef.current.onVisibilityChange?.(isVisible);
      
      return {
        isVisible,
        wasHidden: !isVisible || prevState.wasHidden,
        hiddenTime: newHiddenTime,
        lastVisibilityChange: now,
      };
    });
  }, []); // Remove callbacks dependency

  useEffect(() => {
    // Set initial state
    setState(prevState => ({
      ...prevState,
      isVisible: !document.hidden,
      lastVisibilityChange: new Date(),
    }));

    // Add event listeners for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Reset hidden time counter
  const resetHiddenTime = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      hiddenTime: 0,
      wasHidden: false,
    }));
  }, []);

  // Get visibility statistics
  const getVisibilityStats = useCallback(() => {
    return {
      isCurrentlyVisible: state.isVisible,
      totalHiddenTime: state.hiddenTime,
      wasEverHidden: state.wasHidden,
      lastChange: state.lastVisibilityChange,
    };
  }, [state]);

  return {
    ...state,
    resetHiddenTime,
    getVisibilityStats,
  };
}

/**
 * Hook specifically for timer applications that need to handle time tracking
 * when the page is not visible
 */
export function useTimerPageVisibility(
  onTimerResync?: (hiddenDuration: number) => void,
  onTimerPauseWarning?: () => void
) {
  const [shouldWarnAboutPause, setShouldWarnAboutPause] = useState(false);
  
  const pageVisibility = usePageVisibility({
    onPageHidden: () => {
      // Show warning if timer should be paused when hidden
      setShouldWarnAboutPause(true);
    },
    onPageVisible: (visibleAt, hiddenDuration) => {
      setShouldWarnAboutPause(false);
      
      // If page was hidden for more than a few seconds, resync timer
      if (hiddenDuration > 5) {
        onTimerResync?.(hiddenDuration);
      }
    },
  });

  useEffect(() => {
    if (shouldWarnAboutPause) {
      onTimerPauseWarning?.();
    }
  }, [shouldWarnAboutPause, onTimerPauseWarning]);

  return {
    ...pageVisibility,
    shouldWarnAboutPause,
    clearPauseWarning: () => setShouldWarnAboutPause(false),
  };
}

/**
 * Utility function to detect if the current environment supports page visibility API
 */
export function supportsPageVisibilityAPI(): boolean {
  return typeof document !== 'undefined' && 'hidden' in document;
}

/**
 * Hook to track browser tab focus state (alternative to page visibility)
 */
export function useTabFocus() {
  const [isTabFocused, setIsTabFocused] = useState(true);

  useEffect(() => {
    const handleFocus = () => setIsTabFocused(true);
    const handleBlur = () => setIsTabFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return isTabFocused;
}
