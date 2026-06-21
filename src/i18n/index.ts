import { enUS } from "./en-US";
import { zhCN } from "./zh-CN";
import { readStorage, writeStorage } from "../utils/storage";

export type Locale = "zh-CN" | "en-US";
export type MessageKey = keyof typeof enUS;
type Dictionary = Record<MessageKey, string>;

const LOCALE_KEY = "fastboot-next:locale";
const locales = ["zh-CN", "en-US"] as const;

export const dictionaries: Record<Locale, Dictionary> = {
  "en-US": enUS,
  "zh-CN": zhCN
};

export function detectLocale(): Locale {
  return navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
}

export function getStoredLocale(): Locale {
  return readStorage<Locale>(LOCALE_KEY, detectLocale(), locales);
}

export function storeLocale(locale: Locale): void {
  writeStorage(LOCALE_KEY, locale);
  document.documentElement.lang = locale;
}

export function translate(locale: Locale, key: MessageKey): string {
  return dictionaries[locale][key] ?? dictionaries["en-US"][key];
}
