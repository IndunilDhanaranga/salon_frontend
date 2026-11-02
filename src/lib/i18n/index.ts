import { en } from "./languages/en";
import { si } from "./languages/si";
import type { Language, TranslationDictionary } from "./types";

export * from "./types";
export * from "./i18n-context";
export { LanguagePreferenceModal } from "./components/language-modal";
export { LanguageDropdown } from "./components/language-dropdown";

export const translations: Record<Language, TranslationDictionary> = {
  en,
  si,
};

export const LANGUAGE_STORAGE_KEY = "salon_language";

export const languageNames: Record<
  Language,
  { label: string; nativeName: string; flag: string }
> = {
  en: { label: "English", nativeName: "English", flag: "🇬🇧" },
  si: { label: "Sinhala", nativeName: "සිංහල", flag: "🇱🇰" },
};
