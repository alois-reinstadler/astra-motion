<script lang="ts">
	import { onDestroy } from 'svelte';
	import { motionValue, motionStore } from 'astra-motion/values';
	const value = motionValue(10);
	const count = motionStore(value);
	onDestroy(() => value.destroy());
</script>

<h1>Values</h1>
<button onclick={() => value.set(value.get() + 1)}>Increment</button><output>{$count}</output>
