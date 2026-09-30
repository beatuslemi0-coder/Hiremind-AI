import { useTranslation } from "react-i18next";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// Hidden on night-themed pages (.night, e.g. landing/login/wizards) — those are
// dark-only by design and toggling to light would fight the forced shell.
export default function ThemeToggle() {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("night")) {
    return null;
  }
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("nav.toggle_theme")}
      title={t("nav.toggle_theme")}
      className="glass-pill theme-toggle !px-2.5"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-white" />
      ) : (
        <Moon className="h-4 w-4 text-brand-blue" />
      )}
    </button>
  );
}
