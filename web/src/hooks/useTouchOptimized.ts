"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Touch-optimized utilities for mobile-first SafeWork Pro
 * Provides gesture support, touch feedback, and mobile UX enhancements
 */

// ===== Touch Feedback Hook =====
export function useTouchFeedback() {
  const addTouchFeedback = useCallback((element: HTMLElement) => {
    element.classList.add("touch-feedback");
  }, []);

  return { addTouchFeedback };
}

// ===== Swipe Gesture Detection =====
interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number;
  velocityThreshold?: number;
}

export function useSwipe(handlers: SwipeHandlers, options: SwipeOptions = {}) {
  const { threshold = 50, velocityThreshold = 0.3 } = options;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const deltaTime = Date.now() - touchStart.current.time;

      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold && velocityX > velocityThreshold) {
          if (deltaX > 0) {
            handlers.onSwipeRight?.();
          } else {
            handlers.onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold && velocityY > velocityThreshold) {
          if (deltaY > 0) {
            handlers.onSwipeDown?.();
          } else {
            handlers.onSwipeUp?.();
          }
        }
      }

      touchStart.current = null;
    },
    [handlers, threshold, velocityThreshold]
  );

  return {
    onTouchStart,
    onTouchEnd,
  };
}

// ===== Long Press Detection =====
interface LongPressOptions {
  onLongPress: () => void;
  delay?: number;
}

export function useLongPress(options: LongPressOptions) {
  const { onLongPress, delay = 500 } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onTouchStart = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const onTouchEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchCancel: onTouchEnd,
  };
}

// ===== Pull-to-Refresh =====
interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function usePullToRefresh(options: PullToRefreshOptions) {
  const { onRefresh, threshold = 80 } = options;
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const touchStart = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStart.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStart.current === null || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStart.current;

      if (distance > 0 && scrollRef.current && scrollRef.current.scrollTop === 0) {
        e.preventDefault();
        setIsPulling(true);
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    },
    [isRefreshing, threshold]
  );

  const onTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
    touchStart.current = null;
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    scrollRef,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isPulling,
    isRefreshing,
    pullDistance,
  };
}

// ===== Touch Target Size Validation =====
export function useTouchTargetValidation() {
  const validateTouchTarget = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const minSize = 44; // WCAG minimum touch target

    return {
      isValid: rect.width >= minSize && rect.height >= minSize,
      width: rect.width,
      height: rect.height,
      minSize,
    };
  }, []);

  return { validateTouchTarget };
}

// ===== Device Detection =====
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [hasNotch, setHasNotch] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth <= 768;
      const landscape = window.innerWidth > window.innerHeight;

      // Check for safe area insets (notch detection)
      const notch = CSS.supports("padding: env(safe-area-inset-bottom)");

      setIsMobile(mobile);
      setIsLandscape(landscape);
      setHasNotch(notch);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    window.addEventListener("orientationchange", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("orientationchange", checkDevice);
    };
  }, []);

  return {
    isMobile,
    isLandscape,
    hasNotch,
    isPortrait: !isLandscape,
  };
}

// ===== Prevent iOS Zoom on Input Focus =====
export function usePreventZoom() {
  useEffect(() => {
    // Prevent iOS zoom on input focus by ensuring font-size is at least 16px
    const inputs = document.querySelectorAll("input, select, textarea");

    inputs.forEach((input) => {
      const element = input as HTMLElement;
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);

      if (fontSize < 16) {
        element.style.fontSize = "16px";
      }
    });
  }, []);
}

// ===== Haptic Feedback =====
export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightTap = useCallback(() => vibrate(10), [vibrate]);
  const mediumTap = useCallback(() => vibrate(20), [vibrate]);
  const heavyTap = useCallback(() => vibrate(30), [vibrate]);
  const doubleTap = useCallback(() => vibrate([10, 50, 10]), [vibrate]);
  const errorVibration = useCallback(() => vibrate([30, 100, 30, 100, 30]), [vibrate]);
  const successVibration = useCallback(() => vibrate([10, 50, 10]), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    doubleTap,
    errorVibration,
    successVibration,
  };
}

// ===== Bottom Sheet Hook =====
export function useBottomSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentY = useRef<number>(0);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null || !sheetRef.current) return;

    const deltaY = e.touches[0].clientY - dragStartY.current;

    if (deltaY > 0) {
      currentY.current = deltaY;
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!sheetRef.current) return;

    const threshold = 100;
    if (currentY.current > threshold) {
      close();
    }

    sheetRef.current.style.transform = "";
    dragStartY.current = null;
    currentY.current = 0;
  }, [close]);

  return {
    isOpen,
    open,
    close,
    toggle,
    sheetRef,
    handleProps: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}

// ===== Gesture Prevention (e.g., disable pull-to-refresh) =====
export function useGesturePrevention(elementRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const preventGesture = (e: TouchEvent) => {
      e.preventDefault();
    };

    element.addEventListener("touchmove", preventGesture, { passive: false });

    return () => {
      element.removeEventListener("touchmove", preventGesture);
    };
  }, [elementRef]);
}
