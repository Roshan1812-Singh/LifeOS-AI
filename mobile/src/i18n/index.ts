import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { RTL_LANGUAGES, translations, type TranslationKey } from "./translations";

const LANG_KEY = "lifeos_language";
export const DEFAULT_LANGUAGE = "en";

export interface LanguageOption {
  code: string;
  /** Endonym — the language's own name, so users recognize it. */
  label: string;
}

// Only languages that actually have a translation bundle are offered, each
// labelled in its own script. English is the fallback for any missing key.
export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "ur", label: "اردو" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
];

interface I18nState {
  language: string;
  hydrated: boolean;
  setLanguage: (code: string) => void;
  hydrate: () => Promise<void>;
}

export const useI18nStore = create<I18nState>((set) => ({
  language: DEFAULT_LANGUAGE,
  hydrated: false,

  setLanguage: (code) => {
    set({ language: code });
    SecureStore.setItemAsync(LANG_KEY, code).catch(() => {});
  },

  hydrate: async () => {
    try {
      const saved = await SecureStore.getItemAsync(LANG_KEY);
      if (saved && translations[saved]) set({ language: saved });
    } catch {
      // ignore – fall back to the default language
    } finally {
      set({ hydrated: true });
    }
  },
}));

/** Pure lookup with English fallback and {var} interpolation. */
export function translate(
  language: string,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const dict = translations[language] ?? {};
  let str: string = dict[key] ?? translations.en[key] ?? key;
  if (vars) {
    for (const name of Object.keys(vars)) {
      str = str.replace(new RegExp(`\\{${name}\\}`, "g"), String(vars[name]));
    }
  }
  return str;
}

/** Hook returning a translator bound to the current language (re-renders on change). */
export function useT() {
  const language = useI18nStore((s) => s.language);
  return (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(language, key, vars);
}

export function isRTL(language: string): boolean {
  return RTL_LANGUAGES.has(language);
}

export type { TranslationKey };
