import React, { useMemo } from "react";
import AppInner from "./components/AppInner";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { elGR, enUS } from "@mui/material/locale";
import theme from "./theme";
import { I18nProvider, useI18n } from "./i18n/I18nContext";

function ThemedApp() {
  const { language } = useI18n();
  const localizedTheme = useMemo(
    () => createTheme(theme, language === "el" ? elGR : enUS),
    [language]
  );

  return (
    <ThemeProvider theme={localizedTheme}>
      <CssBaseline />
      <AppInner />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <ThemedApp />
    </I18nProvider>
  );
}
