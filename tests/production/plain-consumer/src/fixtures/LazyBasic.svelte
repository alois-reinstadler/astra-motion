<script lang="ts">
	import { onMount } from 'svelte';
	import * as m from 'astra-motion/m';
	import { LazyMotion } from 'astra-motion/lazy';
	let hydrated = $state(false);
	let ready = $state(false);
	let target = $state(20);
	let input = $state<HTMLInputElement>();
	let identity = $state(false);
	let release!: () => void;
	const requested = new Promise<void>((resolve) => {
		release = resolve;
	});
	async function load() {
		await requested;
		const features = await import('astra-motion/features/dom-animation');
		ready = true;
		return features.default;
	}
	onMount(() => {
		hydrated = true;
	});
	function verify() {
		identity = input === window.__original;
	}
</script>

<main data-hydrated={hydrated} data-ready={ready} data-identity={identity}>
	<button onclick={() => (target = 80)}>Change pending target</button>
	<button onclick={() => release()}>Load features</button>
	<button onclick={verify}>Check identity</button>
	<LazyMotion features={load} strict>
		<m.div data-box initial={false} animate={{ x: target }} transition={{ duration: 0.05 }}
			>Deferred features</m.div
		>
		<m.input bind:ref={input} aria-label="Lazy input" value="before hydration" />
	</LazyMotion>
</main>
