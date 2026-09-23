import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import gsap from "gsap";

import { prefersReducedMotion } from "./motionUtils";

/**
 * Staggered entrance for the direct children of the returned ref.
 *
 * Drop-in motion for the wizard/form pages that have no [data-reveal]
 * markers: wrap the page's outermost element and every direct child
 * (heading, form card, footer note) animates in sequence.
 *
 *   const ref = usePageReveal();
 *   <form ref={ref} className="space-y-5"> … </form>
 */
export function usePageReveal(options = {}) {
  const ref = useRef(null);
  const { y = 22, stagger = 0.09, duration = 0.65, delay = 0.05 } = options;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const targets = Array.from(el.children);
      if (!targets.length) return;

      if (prefersReducedMotion()) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        targets,
        { opacity: 0, y },
        { opacity: 1, y: 0, duration, delay, ease: "power3.out", stagger, overwrite: "auto" }
      );
    },
    { scope: ref }
  );

  return ref;
}
