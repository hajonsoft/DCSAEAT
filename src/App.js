import React from "react";
import AppInner from "./components/AppInner";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <AppInner />
    </ThemeProvider>
  );
}
