'use client';

import { useState, useEffect } from 'react';

interface UseMobileDetectionReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  isTouchDevice: boolean;
}

/**
 * Hook for detecting mobile devices and screen characteristics
 * Uses media queries and user agent detection for comprehensive mobile detection
 */
export function useMobileDetection(): UseMobileDetectionReturn {
  const [state, setState] = useState<UseMobileDetectionReturn>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1920,
    screenHeight: 1080,
    orientation: 'landscape',
    isTouchDevice: false,
  });

  useEffect(() => {
    // SSR guard - only run on client
    if (typeof window === 'undefined') return;

    const updateDeviceInfo = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Breakpoints based on common device sizes
      const isMobile = screenWidth < 768; // Less than md breakpoint
      const isTablet = screenWidth >= 768 && screenWidth < 1024; // md to lg breakpoint
      const isDesktop = screenWidth >= 1024; // lg breakpoint and above
      
      const orientation: 'portrait' | 'landscape' = screenHeight > screenWidth ? 'portrait' : 'landscape';
      
      // Touch device detection
      const isTouchDevice = 'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 || 
        (navigator as any).msMaxTouchPoints > 0;

      setState({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth,
        screenHeight,
        orientation,
        isTouchDevice,
      });
    };

    // Initial check
    updateDeviceInfo();

    // Listen for resize events
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return state;
}

/**
 * Hook for getting responsive breakpoint information
 */
export function useBreakpoint() {
  const { screenWidth } = useMobileDetection();
  
  return {
    xs: screenWidth < 480,
    sm: screenWidth >= 480 && screenWidth < 768,
    md: screenWidth >= 768 && screenWidth < 1024,
    lg: screenWidth >= 1024 && screenWidth < 1280,
    xl: screenWidth >= 1280,
    current: screenWidth < 480 ? 'xs' 
      : screenWidth < 768 ? 'sm'
      : screenWidth < 1024 ? 'md'
      : screenWidth < 1280 ? 'lg'
      : 'xl'
  };
}

/**
 * Hook for responsive values based on screen size
 */
export function useResponsiveValue<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  default: T;
}): T {
  const breakpoint = useBreakpoint();
  
  if (breakpoint.xs && values.xs !== undefined) return values.xs;
  if (breakpoint.sm && values.sm !== undefined) return values.sm;
  if (breakpoint.md && values.md !== undefined) return values.md;
  if (breakpoint.lg && values.lg !== undefined) return values.lg;
  if (breakpoint.xl && values.xl !== undefined) return values.xl;
  
  return values.default;
}

export default useMobileDetection;
