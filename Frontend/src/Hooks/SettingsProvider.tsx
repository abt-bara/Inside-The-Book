import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import languageConfig from "../types/langs.json";
import { SettingsContext, type Language } from "./SettingsContext";

const languageStorageKey = "inside-the-book-language";
const translations: Record<string, Partial<Record<Language, string>>> =
  languageConfig;

function getInitialLanguage(): Language {
  try {
    const savedLanguage = window.localStorage.getItem(languageStorageKey);
    return savedLanguage === "en" || savedLanguage === "ar"
      ? savedLanguage
      : "ar";
  } catch {
    return "ar";
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setCurrentLanguage] = useState<Language>(getInitialLanguage);
  const [message, setMessage] = useState("");

  const setLanguage = useCallback((nextLanguage: Language) => {
    setCurrentLanguage(nextLanguage);
    try {
      window.localStorage.setItem(languageStorageKey, nextLanguage);
      setMessage("");
    } catch {
      setMessage(
        "Language changed for this session, but could not be saved in this browser.",
      );
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = translations["Inside the Book"]?.[language] ?? "Inside the Book";
  }, [language]);

  const t = useCallback(
    (englishText: string) =>
      translations[englishText]?.[language] ?? englishText,
    [language],
  );
  const value = useMemo(
    () => ({ language, setLanguage, t, message }),
    [language, setLanguage, t, message],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
