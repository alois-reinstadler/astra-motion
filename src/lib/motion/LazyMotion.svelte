<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { FeatureBundle, LazyFeatureBundle } from './lazy-context.js';
	export interface LazyMotionProps {
		features: FeatureBundle | LazyFeatureBundle;
		strict?: boolean;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { readActivityState } from './activity-scope.js';
	import { provideLazyMotion, validateFeatureBundle } from './lazy-context.js';
	let { features, strict = false, children }: LazyMotionProps = $props();
	const activity = readActivityState();
	const eager = new SvelteSet<() => void>();
	let loaded = $state.raw<FeatureBundle>();
	let error = $state.raw<{ value: unknown }>();
	const bundle = $derived.by(() => {
		if (typeof features === 'function') return loaded;
		validateFeatureBundle(features);
		return features;
	});
	provideLazyMotion({
		get bundle() {
			return bundle;
		},
		get strict() {
			return strict;
		},
		registerEager(check) {
			eager.add(check);
			return () => {
				eager.delete(check);
			};
		}
	});
	function checkStrictUsage() {
		for (const check of eager) check();
	}
	$effect(checkStrictUsage);
	function loadFeatures() {
		const loader = features;
		if (typeof loader !== 'function' || !activity()) return;
		let current = true;
		error = undefined;
		Promise.resolve()
			.then(() => untrack(loader))
			.then((result) => {
				if (!current) return;
				validateFeatureBundle(result);
				loaded = result;
			})
			.catch((cause) => {
				if (current) error = { value: cause };
			});
		return () => {
			current = false;
		};
	}
	$effect(loadFeatures);
	function reportError() {
		if (error) throw error.value;
	}
	$effect(reportError);
</script>

{@render children?.()}
