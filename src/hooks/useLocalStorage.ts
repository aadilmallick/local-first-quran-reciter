import { useCallback, useState } from "react";
import { LocalStorageBrowser } from "../lib/LocalStorageBrowser";

export function useLocalStorage<T extends Record<string, unknown>, K extends keyof T & string>(
  storage: LocalStorageBrowser<T>,
  key: K,
  defaultValue: T[K]
): [T[K], (value: T[K]) => void, () => void] {
  const [value, setValue] = useState<T[K]>(() => {
    try {
      return storage.get(key) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback(
    (newValue: T[K]) => {
      try {
        storage.set(key, newValue);
        setValue(newValue);
      } catch {
        setValue(newValue);
      }
    },
    [storage, key]
  );

  const remove = useCallback(() => {
    try {
      storage.removeItem(key);
      setValue(defaultValue);
    } catch {
      setValue(defaultValue);
    }
  }, [storage, key, defaultValue]);

  return [value, set, remove];
}
