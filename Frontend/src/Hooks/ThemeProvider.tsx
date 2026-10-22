import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext, type Theme, type ThemeMode } from "./ThemeContext";

const themeStorageKey = "inside-the-book-theme";

function getInitialMode(): ThemeMode {
  const storedMode = window.localStorage.getItem(themeStorageKey);
  return storedMode === "dark" || storedMode === "light" || storedMode === "system"
    ? storedMode
    : "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);
  const [systemIsDark, setSystemIsDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = (event: MediaQueryListEvent) => {
      setSystemIsDark(event.matches);
    };

    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  const theme: Theme = mode === "system" ? (systemIsDark ? "dark" : "light") : mode;

  useEffect(() => {
    window.localStorage.setItem(themeStorageKey, mode);
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themeMode = mode;
    document.documentElement.style.colorScheme = theme;
  }, [mode, theme]);

  const value = useMemo(() => ({ mode, theme, setMode }), [mode, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
