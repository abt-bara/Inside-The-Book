import { createContext } from "react";

export type Language = "ar" | "en";

export interface SettingsContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (englishText: string) => string;
  message: string;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);
