import { useGSAP } from "@gsap/react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./motionUtils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Design-system motion built on GSAP 3.
 *
 * Vocabulary (kept deliberately small, used app-wide):
 *  - useReveal: staggered fade-up when a container's children enter the viewport
 *  - useCountUp: numbers count up when scrolled into view
 *  - usePressable: subtle press/release feedback on interactive cards
 *  - useMagnetic: buttons lean toward the cursor on hover
 *  - useTilt: subtle 3D tilt following the cursor
 *  - usePageTransition: fade+rise entrance on route change
 * All respect prefers-reduced-motion.
 */

/** How far a reveal element travels (px) and the stagger gap (ms). */
const REVEAL_DISTANCE = 26;
const REVEAL_STAGGER_MS = 70;

/**
 * Fade-up + stagger every [data-reveal] child of the returned ref when the
 * container scrolls into view. Usage:
 *   const ref = useReveal();
 *   <section ref={ref}> <div data-reveal>… </div> … </section>
 */
export function useReveal(options = {}) {
  const ref = useRef(null);
  const { y = REVEAL_DISTANCE, stagger = REVEAL_STAGGER_MS, duration = 0.7, delay = 0 } = options;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const targets = el.querySelectorAll("[data-reveal]");
      if (!targets.length) return;

      if (prefersReducedMotion()) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(targets, { opacity: 0, y });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: "power3.out",
        stagger: stagger / 1000,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: ref }
  );

  return ref;
}

/**
 * Count a number up when the element scrolls into view. Returns [ref, display]
 * where display is the formatted current value. Usage:
 *   const [ref, value] = useCountUp(85, { suffix: "%" });
 *   <span ref={ref}>{value}</span>
 */
export function useCountUp(target, options = {}) {
  const { duration = 1.1, suffix = "" } = options;
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        setDisplay(target);
        return;
      }

      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onUpdate: () => setDisplay(Math.round(obj.v)),
      });
    },
    { dependencies: [target] }
  );

  return [ref, `${display}${suffix}`];
}

/**
 * Press feedback for interactive cards/rows: scale down slightly on pointer
 * down, spring back on release. Attach the returned handlers to the element.
 */
export function usePressable() {
  const handlers = {
    onPointerDown: (e) => {
      if (prefersReducedMotion() || e.button !== 0) return;
      gsap.to(e.currentTarget, { scale: 0.985, duration: 0.12, ease: "power2.out" });
    },
    onPointerUp: (e) => {
      if (prefersReducedMotion()) return;
      gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: "power2.out" });
    },
    onPointerLeave: (e) => {
      if (prefersReducedMotion()) return;
      gsap.to(e.currentTarget, { scale: 1, duration: 0.22, ease: "power2.out" });
    },
  };
  return handlers;
}

/**
 * Magnetic hover: the element leans toward the cursor while hovering.
 * Designed for primary buttons. Content gets a slight parallax counter-move.
 */
export function useMagnetic(strength = 0.35) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const inner = el.querySelector("[data-magnetic-inner]");

      const move = (e) => {
        const rect = el.getBoundingClientRect();
        const dx = e.clientX - rect.left - rect.width / 2;
        const dy = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.4, ease: "power3.out" });
        if (inner) {
          gsap.to(inner, { x: dx * strength * 0.4, y: dy * strength * 0.4, duration: 0.4, ease: "power3.out" });
        }
      };
      const leave = () => {
        gsap.to([el, inner].filter(Boolean), { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
      };

      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      };
    },
    { scope: ref }
  );

  return ref;
}

/**
 * Subtle 3D tilt that follows the cursor. Used on feature/problem cards.
 */
export function useTilt(maxDeg = 6) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      gsap.set(el, { transformPerspective: 800, transformStyle: "preserve-3d" });

      const move = (e) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(el, {
          rotateY: px * maxDeg,
          rotateX: -py * maxDeg,
          duration: 0.35,
          ease: "power2.out",
        });
      };
      const leave = () => {
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.6, ease: "power3.out" });
      };

      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      };
    },
    { scope: ref }
  );

  return ref;
}

/**
 * Page-enter transition: fade + small rise on the returned ref whenever
 * `key` changes (pass the route's pathname). Reduced motion: no-op.
 */
export function usePageTransition(key, options = {}) {
  const ref = useRef(null);
  const { duration = 0.4, y = 14 } = options;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(
        el,
        { opacity: 0, y },
        { opacity: 1, y: 0, duration, ease: "power2.out", overwrite: "auto" }
      );
    },
    { dependencies: [key] }
  );

  return ref;
}

export { gsap, ScrollTrigger };
