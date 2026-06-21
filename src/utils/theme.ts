import { readStorage, writeStorage } from "./storage";

export type ThemeMode = "light" | "dark" | "system";

const THEME_KEY = "fastboot-next:theme";
const themeModes = ["light", "dark", "system"] as const;

export function getStoredTheme(): ThemeMode {
  return readStorage<ThemeMode>(THEME_KEY, "system", themeModes);
}

export function resolveTheme(theme: ThemeMode): "light" | "dark" {
  if (theme !== "system") {
    return theme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: ThemeMode): void {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.resolvedTheme = resolved;
}

export function storeTheme(theme: ThemeMode): void {
  writeStorage(THEME_KEY, theme);
  applyTheme(theme);
}

export function watchSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
