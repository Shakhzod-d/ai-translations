import { useCallback, useEffect, useRef, useState } from 'react';
import { toApiError, translateWordList, type WordTranslations } from '@/shared/api';

type Status =
  | { kind: 'idle' }
  | { kind: 'running'; done: number; total: number }
  | { kind: 'error'; error: unknown; words: string[] };

/**
 * Translations are cached per word for the lifetime of the text, so changing the
 * table filters never re-translates words that already have a gloss.
 */
export const useWordTranslations = () => {
  const [translations, setTranslations] = useState<Map<string, WordTranslations>>(new Map());
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const controller = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    setStatus({ kind: 'idle' });
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranslations(new Map());
  }, [stop]);

  useEffect(() => () => controller.current?.abort(), []);

  const translate = useCallback(
    async (words: string[]) => {
      const missing = words.filter((w) => !translations.has(w));
      if (!missing.length) return true;
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      setStatus({ kind: 'running', done: 0, total: missing.length });
      try {
        const result = await translateWordList(missing, {
          signal: abort.signal,
          onProgress: (done) => setStatus({ kind: 'running', done, total: missing.length }),
        });
        if (abort.signal.aborted) return false;
        setTranslations((prev) => new Map([...prev, ...result]));
        setStatus({ kind: 'idle' });
        return true;
      } catch (error) {
        if (abort.signal.aborted || toApiError(error).code === 'ABORTED') return false;
        setStatus({ kind: 'error', error, words });
        return false;
      } finally {
        if (controller.current === abort) controller.current = null;
      }
    },
    [translations],
  );

  return { translations, status, translate, stop, reset };
};
