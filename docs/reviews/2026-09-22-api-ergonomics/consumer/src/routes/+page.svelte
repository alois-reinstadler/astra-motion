<script lang="ts">
	import { resolve } from '$app/paths';
	import Reactivity from '$lib/Reactivity.svelte';
	import Exits from '$lib/Exits.svelte';
	import Layout from '$lib/Layout.svelte';
	import Variants from '$lib/Variants.svelte';
	import Timeline from '$lib/Timeline.svelte';
	import Scroll from '$lib/Scroll.svelte';
	import Dialog from '$lib/Dialog.svelte';
	import { routeShared } from 'astra-motion/routes';
</script>

<h1>Astra adversarial consumer</h1>
<a id="route-next" href={resolve('/detail')}>Route detail</a>
<div id="route-card" {@attach routeShared('review-card')}>Shared route card</div>
<Reactivity /><Exits /><Dialog /><Layout /><Variants /><Timeline /><Scroll />
