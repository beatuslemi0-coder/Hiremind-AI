import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Award,
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

/**
 * Dashboard chrome, after the reference layout: a fixed colored sidebar
 * (brand, primary links, logout pinned at the bottom) and a white topbar
 * (page title, welcome, search) above a floating rounded canvas where the
 * page renders. The topbar lives OUTSIDE the canvas, so its white runs
 * edge-to-edge exactly like the photo.
 */

// Sidebar link set per role. Icons echo the reference: dashboard, profile,
// listings, requests/reviews, plus a score/leaderboard style entry.
const LINKS = {
  interviewee: [
    { to: "/interviewee/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
    { to: "/interviewee/interviews", key: "nav.interviews", icon: Award },
    { to: "/interviewee/sessions", key: "nav.sessions", icon: CalendarClock },
    { to: "/interviewee/documents", key: "nav.documents", icon: FileCheck2 },
    { to: "/interviewee/account", key: "nav.account", icon: Settings },
  ],
  interviewer: [
    { to: "/interviewer/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
    { to: "/interviewer/sessions", key: "nav.sessions", icon: CalendarClock },
    { to: "/interviewer/reviews", key: "nav.reviews", icon: CheckCircle2 },
    { to: "/interviewer/account", key: "nav.account", icon: Settings },
  ],
};

export default function AppShell({ children }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false); // mobile drawer

  const type = user?.type || "interviewee";
  const links = LINKS[type] || LINKS.interviewee;
  const brandName = t("nav.app_name");
  const roleLabel = type === "interviewer" ? t("dash.role_interviewer") : t("dash.role_interviewee");

  const pageKey =
    type === "interviewer"
      ? location.pathname.startsWith("/interviewer/reviews")
        ? "nav.reviews"
        : location.pathname.startsWith("/interviewer/sessions")
          ? "nav.sessions"
          : location.pathname.startsWith("/interviewer/account")
            ? "nav.account"
            : "nav.dashboard"
      : location.pathname.startsWith("/interviewee/interviews")
        ? "nav.interviews"
        : location.pathname.startsWith("/interviewee/sessions")
          ? "nav.sessions"
          : location.pathname.startsWith("/interviewee/documents")
            ? "nav.documents"
            : location.pathname.startsWith("/interviewee/account")
              ? "nav.account"
              : "nav.dashboard";

  function signOut() {
    logout();
    navigate("/login");
  }

  const sidebar = (
    <div className="dash-side flex h-full flex-col">
      {/* Brand */}
      <Link
        to={type === "interviewer" ? "/interviewer/dashboard" : "/interviewee/dashboard"}
        className="flex items-center gap-3 px-6 pt-6 pb-5"
        onClick={() => setOpen(false)}
      >
        <span className="dash-logo">{brandName.slice(0, 1)}</span>
        <span className="text-lg font-extrabold tracking-tight text-white">{brandName}</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-4">
        {links.map(({ to, key, icon: Icon }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`dash-link ${active ? "dash-link--active" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t(key)}</span>
              {active && <span className="dash-link-pill" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer: role tag + logout, pinned bottom like the photo */}
      <div className="px-4 pb-5 space-y-3">
        <button type="button" onClick={signOut} className="dash-logout w-full">
          <LogOut className="h-4 w-4" />
          <span>{t("nav.sign_out")}</span>
        </button>
        <p className="text-center text-[11px] font-medium text-white/70">{roleLabel}</p>
      </div>
    </div>
  );

  return (
    <div className="dash-root">
      {/* Desktop sidebar */}
      <aside className="dash-sidebar hidden lg:block">{sidebar}</aside>

      {/* Mobile menu — a sheet that drops down right below the menu button,
          wearing the same crimson rail so it's never transparent */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="dash-menu-sheet">{sidebar}</aside>
        </div>
      )}

      {/* Main column: white topbar edge-to-edge, then floating canvas */}
      <div className="flex min-h-screen flex-col lg:pl-[240px]">
        <header className="dash-topbar sticky top-0 z-30">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-8">
            <button
              type="button"
              className="dash-iconbtn lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={t("nav.menu")}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Page title: desktop only — on mobile the search takes its place */}
            <h1 className="sr-only font-bold text-gray-900 sm:not-sr-only sm:text-lg">
              {t(pageKey)}
            </h1>

            {/* Mobile search wrapper: centers the compact pill in the space
                between the menu button and the right-hand toggles */}
            <div className="flex flex-1 justify-center sm:hidden">
              <label className="dash-search dash-search--grow flex w-36">
                <Search className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  type="search"
                  placeholder={t("dash.search_placeholder")}
                  aria-label={t("dash.search_placeholder")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
              </label>
            </div>

            <div className="flex items-center gap-2 sm:ml-auto sm:gap-3">
              {/* Welcome chip: avatar + greeting */}
              <span className="hidden md:flex items-center gap-2">
                <span className="dash-welcome">
                  {t("dash.welcome_back")}
                  {user?.jina || user?.jina_la_kampuni
                    ? `, ${user.jina || user.jina_la_kampuni}`
                    : ""}
                </span>
                <span className="dash-avatar" aria-hidden="true">
                  {(user?.jina || user?.jina_la_kampuni || "U").slice(0, 1).toUpperCase()}
                </span>
              </span>

              {/* Search pill */}
              <label className="dash-search hidden sm:flex">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder={t("dash.search_placeholder")}
                  aria-label={t("dash.search_placeholder")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
              </label>

              <button
                type="button"
                className="dash-iconbtn"
                onClick={toggleTheme}
                aria-label={t("nav.toggle_theme")}
                title={t("nav.toggle_theme")}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* Floating canvas — the page content sits on the rounded white sheet */}
        <main className="dash-canvas flex-1">{children}</main>
      </div>
    </div>
  );
}
