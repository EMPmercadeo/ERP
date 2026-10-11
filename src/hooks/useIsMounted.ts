import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns true once mounted on the client, using useSyncExternalStore to avoid
 * hydration mismatch warnings and post-paint re-render flicker.
 */
export function useIsMounted(): boolean {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false
    );
}
