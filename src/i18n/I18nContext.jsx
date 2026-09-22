import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import translations from "./translations";

export const SUPPORTED_LANGUAGES = ["en", "el"];
export const LANGUAGE_STORAGE_KEY = "dcsaeat-language";

const GREEK_TIMEZONES = new Set([
  "Europe/Athens",
  "Europe/Nicosia",
  "Asia/Nicosia",
]);

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
}

function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] == null ? `{${key}}` : String(params[key])
  );
}

function normalizeLanguage(value) {
  if (!value) return null;
  const lower = String(value).toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(lower)) return lower;
  const base = lower.split("-")[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : null;
}

function detectFromBrowser() {
  const candidates = [
    ...(navigator.languages || []),
    navigator.language,
    navigator.userLanguage,
  ];
  for (const candidate of candidates) {
    const matched = normalizeLanguage(candidate);
    if (matched) return matched;
  }
  return null;
}

function detectFromLocation() {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (GREEK_TIMEZONES.has(timeZone)) return "el";
  } catch {
    // Ignore environments without Intl timezone support.
  }
  return null;
}

export function detectLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const storedLang = normalizeLanguage(stored);
    if (storedLang) return storedLang;
  } catch {
    // localStorage may be unavailable.
  }

  return detectFromBrowser() || detectFromLocation() || "en";
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(detectLanguage);

  const setLanguage = useCallback((next) => {
    const normalized = normalizeLanguage(next) || "en";
    setLanguageState(normalized);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
    } catch {
      // Ignore write failures (private mode, disabled storage).
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key, params) => {
      const value =
        getNestedValue(translations[language], key) ??
        getNestedValue(translations.en, key) ??
        key;
      return typeof value === "string" ? interpolate(value, params) : key;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
