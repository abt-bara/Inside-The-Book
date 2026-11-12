import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme-utilities.css";
import "./App.css";
import AppRouter from "./services/AppRouter.tsx";
import { ThemeProvider } from "./Hooks/ThemeProvider";
import { SettingsProvider } from "./Hooks/SettingsProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SettingsProvider>
      <ThemeProvider>
        <AppRouter />
      </ThemeProvider>
    </SettingsProvider>
  </StrictMode>,
);
