import { useLayoutEffect, useRef, useSyncExternalStore } from "react";

export type MotionPolicy = "auto" | "on" | "off";
const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(onChange: () => void) {
  const preference = window.matchMedia?.(motionQuery);
  preference?.addEventListener?.("change", onChange);
  return () => preference?.removeEventListener?.("change", onChange);
}
function reducedMotion() {
  return window.matchMedia?.(motionQuery).matches ?? false;
}

export function useReveal(policy: MotionPolicy = "auto") {
  const root = useRef<HTMLElement>(null);
  const reduced = useSyncExternalStore(subscribeMotion, reducedMotion, () => false);
  const enabled = policy === "on" || (policy === "auto" && !reduced);
  useLayoutEffect(() => {
    if (!enabled || !root.current || typeof IntersectionObserver === "undefined") return;
    const container = root.current;
    const elements = Array.from(
      container.querySelectorAll<HTMLElement>(
        ".hero-prelude, .hero h1, .hero-photo, .hero-event, .section-title, .invitation-text p, .families > p, .invitation-notice, .calendar, .gallery-thumb, .venue-map, .directions > div, .account-group, .closing-photo, .closing-content",
      ),
    );
    const reveal = (element: Element) => element.classList.remove("reveal-pending");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -44px 0px" },
    );
    elements.forEach((element) => {
      const siblings = Array.from(element.parentElement?.children ?? []);
      const index = siblings.indexOf(element);
      if (element.matches(".gallery-thumb")) {
        element.classList.add("reveal-photo");
        element.style.setProperty("--reveal-x", index % 2 === 0 ? "-14px" : "14px");
        element.style.setProperty("--reveal-delay", `${(index % 2) * 110}ms`);
      } else if (element.matches(".hero-photo, .closing-photo, .venue-map")) {
        element.classList.add("reveal-photo");
      } else if (element.matches(".invitation-text p, .families > p, .directions > div, .account-group")) {
        element.style.setProperty("--reveal-delay", `${Math.min(index * 85, 255)}ms`);
      }
      element.classList.add("reveal", "reveal-pending");
    });
    container.classList.add("reveal-initializing");
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        container.classList.remove("reveal-initializing");
        elements.forEach((element) => {
          if (element.classList.contains("reveal-pending")) observer.observe(element);
        });
      });
    });
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof window.Element)) return;
      const element = event.target.closest(".reveal-pending");
      if (!element) return;
      reveal(element);
      observer.unobserve(element);
    };
    container.addEventListener("focusin", onFocus);
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      observer.disconnect();
      container.removeEventListener("focusin", onFocus);
      container.classList.remove("reveal-initializing");
      elements.forEach(reveal);
    };
  }, [enabled]);
  return { root, enabled };
}
