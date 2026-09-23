import { untrack } from 'svelte';

/** The attachment owns this subscription even when the scope was constructed outside a component. */
export function observeAnimatePolicy(read: () => boolean, settle: () => void): () => void {
	function observePolicy() {
		const reduced = read();
		if (reduced) untrack(settle);
	}
	return $effect.root(() => {
		$effect(observePolicy);
	});
}
