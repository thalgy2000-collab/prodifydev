import { useState } from 'react';

export function usePersistedState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setPersistedState = (value: T) => {
    setState(value);
    sessionStorage.setItem(key, JSON.stringify(value));
  };

  return [state, setPersistedState] as const;
}
