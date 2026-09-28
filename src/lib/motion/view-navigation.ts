import { onNavigate } from '$app/navigation';
import { onDestroy } from 'svelte';
import { readMotionConfig } from './config.js';
import { startViewTransition } from './view-transitions.js';
import type { ViewTransitionHandle, ViewTransitionOptions } from './view-types.js';

const owners = new WeakSet<Document>();

/** Install in a persistent SvelteKit layout instead of a second route snapshot coordinator. */
export function viewTransitionsForNavigation(
	options: Omit<ViewTransitionOptions, 'document'> = {}
): void {
	if (typeof document === 'undefined') return;
	const ownerDocument = document;
	if (owners.has(ownerDocument))
		throw new Error(
			'Astra viewTransitionsForNavigation must be installed once in the persistent layout.'
		);
	owners.add(ownerDocument);
	const defaults = readMotionConfig();
	let active: ViewTransitionHandle | undefined;
	onNavigate((navigation) => {
		let release!: () => void;
		const proceed = new Promise<void>((resolve) => (release = resolve));
		const completed = navigation.complete;
		void completed.catch(() => {});
		active = startViewTransition(
			async ({ signal }) => {
				release();
				if (signal.aborted) return;
				let onAbort = () => {};
				const aborted = new Promise<void>((resolve) => {
					onAbort = resolve;
					signal.addEventListener('abort', onAbort, { once: true });
				});
				try {
					await Promise.race([completed, aborted]);
				} finally {
					signal.removeEventListener('abort', onAbort);
				}
			},
			{ ...defaults(), ...options, policy: options.policy ?? 'replace' }
		);
		return proceed;
	});
	onDestroy(() => {
		active?.cancel();
		owners.delete(ownerDocument);
	});
}
