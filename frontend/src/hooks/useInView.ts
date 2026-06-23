'use client';

import { useCallback, useState } from 'react';

export function useInView(threshold = 0.15, once = true) {
  const [inView, setInView] = useState(false);

  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(el);
          }
        },
        { threshold },
      );

      observer.observe(el);
    },
    [threshold, once],
  );

  return { ref, inView };
}
