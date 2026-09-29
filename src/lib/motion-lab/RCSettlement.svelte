<script lang="ts">
	import { useAnimate, motionValue } from '$lib/index.js';
	const [scope, animate] = useAnimate();
	const value = motionValue(0);
	let shown = $state(true);
	export function api() {
		return { scope, animate, value };
	}
	export function detach() {
		shown = false;
	}
</script>

{#if shown}
	<section {@attach scope.attach}>
		<div data-rc-settlement style="opacity:1"></div>
		<div data-rc-second style="opacity:1"></div>
	</section>
{/if}
