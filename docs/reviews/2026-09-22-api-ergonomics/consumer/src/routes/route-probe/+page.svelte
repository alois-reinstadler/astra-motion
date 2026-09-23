<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Motion, presence } from 'astra-motion';
	import { routeShared } from 'astra-motion/routes';
</script>

<h1>Route retention probe</h1>
<a id="route-next" href={resolve('/detail')}>Route detail</a>
{#if page.url.searchParams.has('marked')}
	<div
		id="route-card"
		{@attach routeShared('review-card')}
		transition:presence|global={{ duration: 0 }}
	>
		Shared route card
	</div>
{:else}
	<div id="route-card" {@attach routeShared('review-card')}>Shared route card</div>
{/if}
{#if page.url.searchParams.has('exit')}
	<Motion
		id="unrelated"
		motion={{
			initial: false,
			animate: { opacity: 1 },
			exit: { opacity: 0 },
			transition: { duration: 1 }
		}}>Unrelated exiting sibling</Motion
	>
{/if}
