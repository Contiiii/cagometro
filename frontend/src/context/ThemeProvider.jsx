import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { ThemeContext } from "./theme-context";

const STORAGE_KEY = "cagometro_theme";

const VALID_THEMES = [
  "system",
  "dark",
  "light",
];

function getStoredTheme() {
  const storedTheme = localStorage.getItem(
    STORAGE_KEY,
  );

  return VALID_THEMES.includes(storedTheme)
    ? storedTheme
    : "system";
}

function getSystemDarkPreference() {
  return window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    getStoredTheme,
  );

  const [systemDark, setSystemDark] = useState(
    getSystemDarkPreference,
  );

  const resolvedTheme =
    theme === "system"
      ? systemDark
        ? "dark"
        : "light"
      : theme;

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

    function handleSystemThemeChange(event) {
      setSystemDark(event.matches);
    }

    mediaQuery.addEventListener(
      "change",
      handleSystemThemeChange,
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange,
      );
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);

    root.style.colorScheme = resolvedTheme;

    localStorage.setItem(
      STORAGE_KEY,
      theme,
    );
  }, [theme, resolvedTheme]);

  function setTheme(nextTheme) {
    if (!VALID_THEMES.includes(nextTheme)) {
      console.error(
        `Tema non valido: ${nextTheme}`,
      );

      return;
    }

    setThemeState(nextTheme);
  }

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      isDark: resolvedTheme === "dark",
    }),
    [theme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}