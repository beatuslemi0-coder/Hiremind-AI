import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Theme context — "light" | "dark".
 * Default follows the OS (prefers-color-scheme); an explicit toggle choice
 * persists to localStorage and wins from then on. The .dark class on <html>
 * drives every style in index.css, set here before first paint of the app.
 */
const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

function initialTheme() {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem("app_theme");
  // The site's design is total-black by default; an explicit "light" choice
  // (via the toggle) still wins so the toggle stays functional.
  return saved === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("app_theme", theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
