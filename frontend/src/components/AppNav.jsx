import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileCheck2, LayoutDashboard, ListChecks, LogOut, MessageSquareText } from "lucide-react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";

export default function AppNav() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isInterviewer = user?.type === "interviewer";

  const links = isInterviewer
    ? [
        { to: "/interviewer/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
        { to: "/interviewer/reviews", label: t("nav.reviews"), icon: FileCheck2 },
      ]
    : [
        { to: "/interviewee/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
        { to: "/interviewee/interviews", label: t("nav.interviews"), icon: ListChecks },
        { to: "/interviewee/documents", label: t("nav.documents"), icon: FileCheck2 },
      ];

  function signOut() {
    logout();
    navigate("/login");
  }

  // Hide the nav on the live session screen — full focus, no chrome.
  if (location.pathname === "/interviewee/session") return null;

  return (
    <nav className="glass-nav">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link to={isInterviewer ? "/interviewer/dashboard" : "/interviewee/dashboard"} className="flex items-center gap-2 shrink-0">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-gold to-brand-blue flex items-center justify-center text-white text-xs font-bold shadow-sm">
            M
          </span>
          <span className="font-bold tracking-tight text-gray-900 hidden sm:block">{t("nav.app_name")}</span>
        </Link>

        <div className="flex items-center gap-1.5 min-w-0">
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={`glass-pill !px-3 !py-1.5 !text-xs ${
                  active ? "!border-brand-gold/60 text-brand-blue dark:text-brand-gold" : "text-gray-600"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <LanguageToggle />
          <ThemeToggle />
          <button type="button" onClick={signOut} className="glass-pill !px-2.5" title={t("nav.sign_out")}>
            <LogOut className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    </nav>
  );
}
