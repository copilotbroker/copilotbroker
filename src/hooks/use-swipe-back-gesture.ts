import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Mobile horizontal swipe navigation.
 *
 * - Swipe right (anywhere on screen) → history back (navigate(-1))
 * - Swipe left  (anywhere on screen) → history forward (navigate(1))
 *
 * Disabled on desktop (≥ 1024px). Ignored on inputs, sliders, horizontal
 * carousels, scroll-area viewports, and elements that opt-out via
 * [data-no-swipe-back]. Requires a fast, mostly-horizontal motion.
 */
export function useSwipeBackGesture() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;

    const MIN_DX = 90;
    const MAX_DY_RATIO = 0.6; // dy/|dx| must stay below this for horizontal intent
    const MAX_MS = 600;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let tracking = false;

    const isOptedOut = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return !!target.closest(
        '[data-no-swipe-back], input, textarea, [contenteditable="true"], [role="slider"], .embla, .swiper, [data-radix-scroll-area-viewport]'
      );
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (isOptedOut(e.target)) return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startT = Date.now();
      tracking = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      const dt = Date.now() - startT;
      if (dt > MAX_MS) return;
      const absDx = Math.abs(dx);
      if (absDx < MIN_DX) return;
      if (dy / Math.max(absDx, 1) > MAX_DY_RATIO) return;

      if (dx > 0) {
        // Swipe right → back
        if (window.history.length > 1) navigate(-1);
      } else {
        // Swipe left → forward
        navigate(1);
      }
    };

    const onTouchCancel = () => { tracking = false; };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [navigate, location.pathname]);
}
