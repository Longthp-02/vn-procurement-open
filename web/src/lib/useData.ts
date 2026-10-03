import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import type { DataSource } from './data';

export const DataContext = createContext<DataSource | null>(null);

export function useDataSource(): DataSource {
  const ds = useContext(DataContext);
  if (!ds) throw new Error('DataContext is missing: wrap the app in <DataContext.Provider>');
  return ds;
}

export type Result<T> =
  | { state: 'loading'; retry: () => void }
  | { state: 'ok'; data: T; retry: () => void }
  | { state: 'error'; error: unknown; retry: () => void };

/** Load data for a page. Responses for an outdated key (e.g. after navigation) are ignored. */
export function useData<T>(load: (ds: DataSource) => Promise<T>, key: string): Result<T> {
  const ds = useDataSource();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; attempt: number; state: 'ok' | 'error'; data?: T; error?: unknown } | null>(null);
  const retry = () => setAttempt((a) => a + 1);

  useEffect(() => {
    let current = true;
    load(ds).then(
      (data) => current && setResult({ key, attempt, state: 'ok', data }),
      (error) => current && setResult({ key, attempt, state: 'error', error }),
    );
    return () => {
      current = false;
    };
    // `load` is recreated every render; `key` identifies what it loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ds, key, attempt]);

  if (!result || result.key !== key || result.attempt !== attempt) return { state: 'loading', retry };
  return result.state === 'ok' ? { state: 'ok', data: result.data as T, retry } : { state: 'error', error: result.error, retry };
}

export function useTitle(title: string | null) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
