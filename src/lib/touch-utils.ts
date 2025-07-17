/**
 * Touch gesture utilities for mobile interactions
 * Provides touch event handling, gesture recognition, and mobile-optimized interactions
 */

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeGesture {
  direction: 'up' | 'down' | 'left' | 'right';
  distance: number;
  duration: number;
  velocity: number;
}

export interface PinchGesture {
  scale: number;
  center: TouchPoint;
}

export interface TapGesture {
  point: TouchPoint;
  tapCount: number;
}

// Touch gesture configuration
export const TOUCH_CONFIG = {
  swipe: {
    minDistance: 30,
    maxTime: 300,
    minVelocity: 0.3,
  },
  tap: {
    maxDistance: 10,
    maxTime: 200,
    doubleTapTime: 300,
  },
  longPress: {
    minTime: 500,
    maxDistance: 10,
  },
  pinch: {
    minScale: 0.5,
    maxScale: 3,
  },
};

/**
 * Calculate distance between two touch points
 */
export function getTouchDistance(point1: TouchPoint, point2: TouchPoint): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate velocity between two touch points
 */
export function getTouchVelocity(start: TouchPoint, end: TouchPoint): number {
  const distance = getTouchDistance(start, end);
  const time = end.timestamp - start.timestamp;
  return time > 0 ? distance / time : 0;
}

/**
 * Determine swipe direction based on touch points
 */
export function getSwipeDirection(start: TouchPoint, end: TouchPoint): SwipeGesture['direction'] | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Check if movement is significant enough
  if (Math.max(absDx, absDy) < TOUCH_CONFIG.swipe.minDistance) {
    return null;
  }

  // Determine primary direction
  if (absDx > absDy) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'down' : 'up';
  }
}

/**
 * Create a touch point from a touch event
 */
export function createTouchPoint(touch: Touch, timestamp?: number): TouchPoint {
  return {
    x: touch.clientX,
    y: touch.clientY,
    timestamp: timestamp || Date.now(),
  };
}

/**
 * Custom hook for swipe gesture detection
 */
export function useSwipeGesture(
  onSwipe: (gesture: SwipeGesture) => void,
  config: Partial<typeof TOUCH_CONFIG.swipe> = {}
) {
  const swipeConfig = { ...TOUCH_CONFIG.swipe, ...config };
  let startPoint: TouchPoint | null = null;

  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 1 && event.touches[0]) {
      startPoint = createTouchPoint(event.touches[0]);
    }
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (!startPoint || event.changedTouches.length !== 1 || !event.changedTouches[0]) {
      return;
    }

    const endPoint = createTouchPoint(event.changedTouches[0]);
    const distance = getTouchDistance(startPoint, endPoint);
    const duration = endPoint.timestamp - startPoint.timestamp;
    const velocity = getTouchVelocity(startPoint, endPoint);
    const direction = getSwipeDirection(startPoint, endPoint);

    if (
      direction &&
      distance >= swipeConfig.minDistance &&
      duration <= swipeConfig.maxTime &&
      velocity >= swipeConfig.minVelocity
    ) {
      onSwipe({
        direction,
        distance,
        duration,
        velocity,
      });
    }

    startPoint = null;
  };

  const handleTouchCancel = () => {
    startPoint = null;
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };
}

/**
 * Custom hook for tap gesture detection
 */
export function useTapGesture(
  onTap: (gesture: TapGesture) => void,
  onDoubleTap?: (gesture: TapGesture) => void,
  config: Partial<typeof TOUCH_CONFIG.tap> = {}
) {
  const tapConfig = { ...TOUCH_CONFIG.tap, ...config };
  let startPoint: TouchPoint | null = null;
  let lastTap: TapGesture | null = null;

  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 1 && event.touches[0]) {
      startPoint = createTouchPoint(event.touches[0]);
    }
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (!startPoint || event.changedTouches.length !== 1 || !event.changedTouches[0]) {
      return;
    }

    const endPoint = createTouchPoint(event.changedTouches[0]);
    const distance = getTouchDistance(startPoint, endPoint);
    const duration = endPoint.timestamp - startPoint.timestamp;

    if (
      distance <= tapConfig.maxDistance &&
      duration <= tapConfig.maxTime
    ) {
      const tapGesture: TapGesture = {
        point: endPoint,
        tapCount: 1,
      };

      // Check for double tap
      if (
        onDoubleTap &&
        lastTap &&
        endPoint.timestamp - lastTap.point.timestamp <= tapConfig.doubleTapTime &&
        getTouchDistance(lastTap.point, endPoint) <= tapConfig.maxDistance
      ) {
        tapGesture.tapCount = 2;
        onDoubleTap(tapGesture);
        lastTap = null;
      } else {
        onTap(tapGesture);
        lastTap = tapGesture;
      }
    }

    startPoint = null;
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

/**
 * Custom hook for long press gesture detection
 */
export function useLongPressGesture(
  onLongPress: (point: TouchPoint) => void,
  config: Partial<typeof TOUCH_CONFIG.longPress> = {}
) {
  const longPressConfig = { ...TOUCH_CONFIG.longPress, ...config };
  let startPoint: TouchPoint | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 1 && event.touches[0]) {
      startPoint = createTouchPoint(event.touches[0]);
      
      timeoutId = setTimeout(() => {
        if (startPoint) {
          onLongPress(startPoint);
        }
      }, longPressConfig.minTime);
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!startPoint || !timeoutId || !event.touches[0]) return;

    const currentPoint = createTouchPoint(event.touches[0]);
    const distance = getTouchDistance(startPoint, currentPoint);

    if (distance > longPressConfig.maxDistance) {
      clearTimeout(timeoutId);
      timeoutId = null;
      startPoint = null;
    }
  };

  const handleTouchEnd = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    startPoint = null;
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
  };
}

/**
 * Custom hook for pinch gesture detection
 */
export function usePinchGesture(
  onPinch: (gesture: PinchGesture) => void,
  config: Partial<typeof TOUCH_CONFIG.pinch> = {}
) {
  const pinchConfig = { ...TOUCH_CONFIG.pinch, ...config };
  let initialDistance: number | null = null;
  let initialCenter: TouchPoint | null = null;

  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 2 && event.touches[0] && event.touches[1]) {
      const touch1 = createTouchPoint(event.touches[0]);
      const touch2 = createTouchPoint(event.touches[1]);
      
      initialDistance = getTouchDistance(touch1, touch2);
      initialCenter = {
        x: (touch1.x + touch2.x) / 2,
        y: (touch1.y + touch2.y) / 2,
        timestamp: Date.now(),
      };
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!initialDistance || !initialCenter || event.touches.length !== 2 || !event.touches[0] || !event.touches[1]) {
      return;
    }

    const touch1 = createTouchPoint(event.touches[0]);
    const touch2 = createTouchPoint(event.touches[1]);
    const currentDistance = getTouchDistance(touch1, touch2);
    const scale = currentDistance / initialDistance;

    if (scale >= pinchConfig.minScale && scale <= pinchConfig.maxScale) {
      const center = {
        x: (touch1.x + touch2.x) / 2,
        y: (touch1.y + touch2.y) / 2,
        timestamp: Date.now(),
      };

      onPinch({ scale, center });
    }
  };

  const handleTouchEnd = () => {
    initialDistance = null;
    initialCenter = null;
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
  };
}

/**
 * Utility to prevent default touch behaviors
 */
export function preventTouchDefaults(event: TouchEvent) {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Utility to check if device supports touch
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Utility to add haptic feedback on supported devices
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    };
    navigator.vibrate(patterns[type]);
  }
}

/**
 * Utility to debounce touch events
 */
export function debounceTouchEvent<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout;
  
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default {
  useSwipeGesture,
  useTapGesture,
  useLongPressGesture,
  usePinchGesture,
  getTouchDistance,
  getTouchVelocity,
  getSwipeDirection,
  createTouchPoint,
  preventTouchDefaults,
  isTouchDevice,
  hapticFeedback,
  debounceTouchEvent,
  TOUCH_CONFIG,
};
