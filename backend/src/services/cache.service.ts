type Entry = { value: any; expiresAt: number };
const store = new Map<string, Entry>();

export function cacheGet<T = any>(key: string): T | undefined {
  const e = store.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expiresAt) { store.delete(key); return undefined; }
  return e.value as T;
}

export function cacheSet(key: string, value: any, ttlMs: number) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheInvalidate(key: string) {
  store.delete(key);
}

export function cacheInvalidatePrefix(prefix: string) {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
