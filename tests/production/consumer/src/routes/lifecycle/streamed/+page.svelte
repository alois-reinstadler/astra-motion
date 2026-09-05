<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { routeShared } from 'astra-motion/routes';
	let { data }: PageProps = $props();
</script>

<h1>Streamed shared content</h1>
<p data-testid="stream-mode">{data.mode}</p>
{#if data.mode === 'reserved'}
	<div class="photograph" data-testid="reserved-host" {@attach routeShared('lifecycle-photo')}>
		{#await data.photo}<span data-testid="stream-pending">Loading photograph…</span
			>{:then photo}<strong data-testid="stream-result">{photo.title}</strong>{/await}
	</div>
{:else}
	{#await data.photo}
		<p data-testid="stream-pending">Loading photograph… No shared host exists yet.</p>
	{:then photo}
		<div class="photograph" data-testid="late-host" {@attach routeShared('lifecycle-photo')}>
			<strong data-testid="stream-result">{photo.title}</strong>
		</div>
	{/await}
{/if}
<a href={resolve('/lifecycle/cache')} data-testid="return-cache">Back to collection</a>

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
