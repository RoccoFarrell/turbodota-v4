import { createToaster } from '@skeletonlabs/skeleton-svelte';

/**
 * Single shared toaster instance so Toast.Group and trigger calls use the same store.
 * Use toaster.success/error/warning/info({ title, description? }) per Skeleton docs.
 * placement: 'bottom' = bottom center (matches Skeleton docs default).
 * overlap: false = stack mode so multiple toasts show in a vertical list (overlap: true piles them so only one is visible until hover).
 */
export const toaster = createToaster({
	placement: 'bottom',
	overlap: false
});
