<script lang="ts">
	import { onMount } from 'svelte';
	import { TextReveal, TextSwap } from 'astra-motion/text';
	let hydrated = $state(false);
	let saved = $state(false);
	let visible = $state(true);
	onMount(() => {
		hydrated = true;
	});
</script>

<main data-hydrated={hydrated}>
	<TextReveal as="h1" text="Packed text 👩🏽‍💻 é" split="graphemes" effect="blur" duration={0.05} />
	<button data-swap-button onclick={() => (saved = !saved)}>
		<TextSwap
			text={saved ? 'Saved successfully' : 'Save changes'}
			mode="wait"
			size="reserve"
			alternatives={['Save changes', 'Saved successfully']}
			effect="slide"
			split="words"
			stagger={0.01}
			duration={0.05}
		/>
	</button>
	<button onclick={() => (visible = !visible)}>Toggle reveal</button>
	<TextReveal
		data-state-reveal
		as="p"
		text="A complete readable message"
		trigger="state"
		{visible}
		duration={0.05}
	/>
	<TextSwap data-fixed text="Fixed region" size="fixed" style="width:180px;height:90px" />
</main>
