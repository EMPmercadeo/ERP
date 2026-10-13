/**
 * Centralized client-side error dispatcher to /api/client-errors.
 * Used by React error boundaries to record uncaught client runtime errors.
 */
export function logClientError(payload: Record<string, unknown>) {
    if (typeof window === 'undefined') return;
    fetch('/api/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).catch((err) => {
        console.error('Failed to dispatch error report:', err);
    });
}
