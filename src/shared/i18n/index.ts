import { dictionaries } from "@shared/i18n/dictionaries";
import { platformStorage } from "@shared/storage/platformStorage";
import type { LocaleCode, TranslationKey } from "@shared/types/i18n";

export interface ResolveLocaleInput {
  search: string;
  storedLocale: LocaleCode | null;
  navigatorLanguages: string[];
}

const normalize = (value: string | null | undefined): LocaleCode | null => {
  if (!value) return null;
  const short = value.trim().toLowerCase().slice(0, 2);
  if (short === "en" || short === "es") return short;
  return null;
};

export const resolveLocale = ({ search, storedLocale, navigatorLanguages }: ResolveLocaleInput): LocaleCode => {
  const params = new URLSearchParams(search);
  const queryLocale = normalize(params.get("lang"));
  if (queryLocale) return queryLocale;

  const stored = normalize(storedLocale ?? undefined);
  if (stored) return stored;

  for (const value of navigatorLanguages) {
    const navLocale = normalize(value);
    if (navLocale) return navLocale;
  }

  return "en";
};

export interface I18nRuntime {
  locale: LocaleCode;
  t: (key: TranslationKey) => string;
  setLocale: (locale: LocaleCode) => void;
}

export const createI18n = (search = ""): I18nRuntime => {
  const runtime: I18nRuntime = {
    locale: "en",
    t(key) {
      return dictionaries[runtime.locale][key] ?? dictionaries.en[key] ?? key;
    },
    setLocale(locale) {
      runtime.locale = locale;
      platformStorage.setLocale(locale);
    }
  };

  const navigatorLanguages =
    typeof navigator !== "undefined" && Array.isArray(navigator.languages)
      ? [...navigator.languages]
      : [];

  const locale = resolveLocale({
    search,
    storedLocale: platformStorage.getLocale(),
    navigatorLanguages
  });

  runtime.setLocale(locale);
  return runtime;
};
