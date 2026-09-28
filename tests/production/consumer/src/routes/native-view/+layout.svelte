<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AnimateView } from 'astra-motion/view';
	import { viewTransitionsForNavigation } from 'astra-motion/view-navigation';
	let { children: content }: { children: Snippet } = $props();
	viewTransitionsForNavigation();
</script>

<AnimateView name="packed-navigation" enter={{ opacity: [0, 1] }}>
	{#snippet children(attach)}<article {@attach attach} data-native-navigation>
			{@render content()}
		</article>{/snippet}
</AnimateView>
