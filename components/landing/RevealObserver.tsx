"use client";

import { useEffect } from "react";
import "@/components/demo/demo-events";

/** Reveals [data-reveal] elements once as they scroll into view. The hidden state only applies under html.js. */
export function RevealObserver() {
  useEffect(() => {
    window.__sbRevealReady = true;
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.setAttribute("data-revealed", ""));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
