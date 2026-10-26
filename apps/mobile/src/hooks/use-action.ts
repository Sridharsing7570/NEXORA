import { useCallback, useState } from 'react';

import { errorMessage } from '@/lib/api';

/**
 * Loading and error state for one user action (save, verify, …).
 * `run` resolves `true` on success and `false` after showing the error, so callers can
 * continue only when the action worked.
 */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (task: () => Promise<void>): Promise<boolean> => {
    setError(null);
    setBusy(true);
    try {
      await task();
      return true;
    } catch (caught) {
      setError(errorMessage(caught));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, setError, run };
}
