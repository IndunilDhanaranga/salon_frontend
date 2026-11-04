"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  translations,
  LANGUAGE_STORAGE_KEY,
  type Language,
  type TranslationDictionary,
} from "./index";

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
  needsLanguageSelection: boolean;
  completeLanguageSelection: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  isLoggedIn = false,
}: {
  children: React.ReactNode;
  isLoggedIn?: boolean;
}) {
  const [language, setLanguageState] = useState<Language>("en");
  const [needsPrompt, setNeedsPrompt] = useState(false);
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    document.documentElement.lang = language === "si" ? "si-LK" : "en";
  }, [language]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        LANGUAGE_STORAGE_KEY,
      ) as Language | null;
      if (stored === "en" || stored === "si") {
        setLanguageState(stored);
        setNeedsPrompt(false);
      } else {
        // Not saved in local storage yet
        if (isLoggedIn) {
          setNeedsPrompt(true);
        }
      }
    } catch {
      // Safe fallback if local storage is disabled
    } finally {
      setInitialized(true);
    }
  }, [isLoggedIn]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Safe fallback
    }
  }, []);

  const completeLanguageSelection = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      setNeedsPrompt(false);
    },
    [setLanguage],
  );

  const t = useMemo(
    () => translations[language] ?? translations.en,
    [language],
  );

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        needsLanguageSelection: needsPrompt && isLoggedIn && initialized,
        completeLanguageSelection,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      language: "en" as Language,
      setLanguage: () => {},
      t: translations.en,
      needsLanguageSelection: false,
      completeLanguageSelection: () => {},
    };
  }
  return ctx;
}
