<script lang="ts">
	import { fade } from 'svelte/transition';
	import { routeShared, routeTransitions } from '../motion/routes.js';
	let {
		nested = false,
		duplicate = false,
		authoredInert = false
	}: { nested?: boolean; duplicate?: boolean; authoredInert?: boolean } = $props();
	let detail = $state(false);
	const diagnostics: string[] = [];
	routeTransitions({
		reducedMotion: 'never',
		onDiagnostic: (message) => diagnostics.push(message)
	});
	export function navigate(value = true) {
		detail = value;
	}
	export function issues() {
		return diagnostics;
	}
</script>

<div data-route-persistent {@attach routeShared('persistent')}>Persistent identity</div>

{#if detail}
	<section>
		<div data-route-destination {@attach routeShared('review-object')}>Destination</div>
		{#if duplicate}<div data-route-duplicate {@attach routeShared('review-object')}>
				Duplicate
			</div>{/if}
	</section>
{:else if nested}
	<section out:fade|global={{ duration: 1000 }}>
		<div
			data-route-source
			{@attach routeShared('review-object')}
			out:fade|global={{ duration: 100 }}
		>
			Identity inside an outgoing parent
		</div>
	</section>
{:else}
	<div
		data-route-source
		inert={authoredInert}
		{@attach routeShared('review-object')}
		out:fade|global={{ duration: 1000 }}
	>
		Outgoing source retained by Svelte
	</div>
{/if}
