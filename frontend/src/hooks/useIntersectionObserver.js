import { useState, useEffect, useRef } from "react";

/**
 * useIntersectionObserver
 *
 * Returns [ref, isIntersecting] — attach ref to the element you want to observe.
 * Once the element enters the viewport, isIntersecting becomes true and the
 * observer disconnects (fires only once — use for lazy initialization).
 *
 * @param {Object} options
 * @param {number} options.threshold  — 0 to 1, portion of element visible before firing (default 0.1)
 * @param {string} options.rootMargin — CSS margin around root, e.g. "50px" to fire 50px before visible
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // If already triggered, or IntersectionObserver not supported, skip
    if (isIntersecting) return;
    if (typeof IntersectionObserver === "undefined") {
      // Fallback for old browsers: immediately show content
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect(); // Only fire once — no continuous tracking needed
        }
      },
      {
        threshold: options.threshold ?? 0.1,
        // Start loading 50px before the element enters the viewport
        // so content is ready by the time the user scrolls to it
        rootMargin: options.rootMargin ?? "50px",
      },
    );

    const el = ref.current;
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, [isIntersecting, options.threshold, options.rootMargin]);

  return [ref, isIntersecting];
}

export default useIntersectionObserver;
