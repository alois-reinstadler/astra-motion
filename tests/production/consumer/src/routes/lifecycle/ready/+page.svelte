<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { routeShared } from 'astra-motion/routes';
	let { data }: PageProps = $props();
</script>

<h1>Awaited shared content</h1>
<div class="photograph" data-testid="awaited-host" {@attach routeShared('lifecycle-photo')}>
	{data.title}
</div>
<a href={resolve('/lifecycle/cache')} data-testid="return-cache">Back to collection</a>
<a href={resolve('/lifecycle/outside')} data-sveltekit-reload data-testid="leave-document"
	>Leave this document</a
>

<style>
	.photograph {
		width: 360px;
		max-width: 100%;
		height: 240px;
		background: #cf7356;
		display: grid;
		place-items: center;
		margin: 20px 0;
	}
</style>
