import { Link } from "react-router-dom";
import { useCountUp, usePressable, useReveal } from "../lib/motion";

export function StatCard({ label, value, suffix = "", tone = "default" }) {
  const numeric = typeof value === "number";
  const [ref, display] = useCountUp(numeric ? value : 0, { suffix });
  const press = usePressable();
  const tones = {
    default: "text-gray-900",
    blue: "text-brand-blue",
    green: "text-emerald-600",
    amber: "text-amber-600",
    pink: "text-brand-pink",
  };
  return (
    <div ref={ref} {...press} className="app-card app-card--hover p-4 text-center">
      <p className={`text-2xl font-bold tracking-tight ${tones[tone]}`}>
        {numeric ? display : value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

export function Badge({ tone = "gray", children, className = "" }) {
  const tones = {
    green: "abadge-green",
    amber: "abadge-amber",
    red: "abadge-red",
    gray: "abadge-gray",
    blue: "abadge-blue",
  };
  return <span className={`${tones[tone]} ${className}`}>{children}</span>;
}

/**
 * Dashboard stat tile: big accent number + tiny muted label, floating on a
 * white card (the reference photo's stat language). Clickable when `to` given.
 */
export function DashStat({ label, value, to, tone = "crimson", className = "" }) {
  const tones = {
    crimson: "text-[#E0265C]",
    blue: "text-brand-blue",
    green: "text-emerald-600",
    amber: "text-amber-600",
  };
  const inner = (
    <>
      <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${tones[tone]}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] font-semibold text-gray-400">
        {label}
      </p>
    </>
  );
  const cls = `dash-stat ${className}`;
  return to ? (
    <Link to={to} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function Section({ title, action, children, className = "" }) {
  const ref = useReveal();
  return (
    <section ref={ref} className={className}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between" data-reveal>
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          {action}
        </div>
      )}
      <div data-reveal>{children}</div>
    </section>
  );
}

export function LinkButton({ to, variant = "primary", size, children, className = "" }) {
  const base = variant === "primary" ? "abtn-primary" : variant === "accent" ? "abtn-accent" : variant === "outline" ? "abtn-outline" : "abtn-ghost";
  return (
    <Link to={to} className={`${base} ${size === "sm" ? "abtn-sm" : ""} ${className}`}>
      {children}
    </Link>
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="app-card p-8 text-center">
      {Icon && (
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue/[0.07] text-brand-blue">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

/** Progress bar with gradient fill. */
export function Progress({ value, className = "" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`aprogress ${className}`}>
      <div className="aprogress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
