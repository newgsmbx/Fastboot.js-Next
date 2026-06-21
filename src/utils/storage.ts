export function readStorage<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  const value = localStorage.getItem(key);
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function writeStorage(key: string, value: string): void {
  localStorage.setItem(key, value);
}
