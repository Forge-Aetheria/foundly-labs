import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Refetches the screen's primary query whenever the route regains focus.
 * The first focus is skipped because the query already runs on mount.
 */
export function useRefetchOnFocus(refetch: () => void): void {
  const hasFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocused.current) {
        hasFocused.current = true;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
