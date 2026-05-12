import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * iOS-style edge swipe to go back.
 *
 * Triggers history.back() when the user swipes from the very left edge of the
 * screen (≤ 24px) to the right by more than 80px in under 600ms, with a
 * mostly-horizontal motion. Disabled on desktop (≥ 1024px) and ignored on
 * inputs, scrollable horizontal carousels, range sliders, and elements that
 * opt-out via [data-no-swipe-back].
 */
export function useSwipeBackGesture() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;

    const EDGE_PX = 24;
    const MIN_DX = 80;
    const MAX_DY_RATIO = 0.6; // dy/dx must stay below this for horizontal intent
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
      const t = e.touches[0];
      if (t.clientX > EDGE_PX) return;
      if (isOptedOut(e.target)) return;
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
      if (dx < MIN_DX) return;
      if (dy / Math.max(dx, 1) > MAX_DY_RATIO) return;

      // Don't override the browser's own back swipe in mobile Safari (it already works).
      // In standalone PWAs / WebViews this is the primary mechanism.
      if (window.history.length > 1) {
        navigate(-1);
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
