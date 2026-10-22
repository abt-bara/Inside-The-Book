import { createContext } from "react";

export type ThemeMode = "dark" | "system" | "light";
export type Theme = Exclude<ThemeMode, "system">;

export interface ThemeContextValue {
  mode: ThemeMode;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
