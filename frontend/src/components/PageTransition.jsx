import { useLocation } from "react-router-dom";
import { usePageTransition } from "../lib/motion";

/**
 * Fade+rise entrance on every route change.
 * The landing page is excluded — it owns ScrollSmoother, and a transform on
 * an ancestor would break its fixed-position wrapper during the animation.
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const ref = usePageTransition(pathname);

  if (pathname === "/") return <>{children}</>;
  return <div ref={ref}>{children}</div>;
}
