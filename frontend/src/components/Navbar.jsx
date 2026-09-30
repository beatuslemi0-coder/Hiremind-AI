import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleLang = () => i18n.changeLanguage(i18n.language === "en" ? "hi" : "en");

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold text-brand-600">
          {t("app.title")}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-slate-600 hover:text-brand-600">
            {t("nav.dashboard")}
          </Link>
          <Link to="/interview" className="text-slate-600 hover:text-brand-600">
            {t("nav.interview")}
          </Link>
          <button
            onClick={toggleLang}
            className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
          >
            {i18n.language === "en" ? "हिं" : "EN"}
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-slate-500 hover:text-red-500"
          >
            {t("nav.logout")}
          </button>
        </nav>
      </div>
      <div className="mx-auto max-w-4xl px-4 pb-2 text-xs text-slate-400">{user?.email}</div>
    </header>
  );
}
