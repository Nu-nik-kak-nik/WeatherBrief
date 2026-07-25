import { useEffect, useRef } from "react";

export const useSwipe = (onSwipeLeft, onSwipeRight, threshold = 50) => {
  const touchStart = useRef(0);
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStart.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e) => {
      const diff = e.changedTouches[0].clientX - touchStart.current;
      if (Math.abs(diff) > threshold) {
        if (diff > 0) onSwipeRight?.();
        else onSwipeLeft?.();
      }
    };
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold]);
};
