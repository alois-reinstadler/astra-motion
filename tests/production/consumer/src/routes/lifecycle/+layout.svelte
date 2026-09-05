<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import { routeTransitions } from 'astra-motion/routes';
	let { children }: { children: Snippet } = $props();
	let diagnostics = $state<string[]>([]);
	routeTransitions({
		onDiagnostic: (message) => {
			diagnostics = [...diagnostics, message];
		}
	});
</script>

<div class="lifecycle-shell">
	<nav aria-label="Lifecycle cases">
		<a href={resolve('/lifecycle/cache')}>Cache</a><a href={resolve('/lifecycle/streamed')}
			>Streamed</a
		><a href={resolve('/lifecycle/ready')}>Awaited</a><a href={resolve('/lifecycle/hmr')}>HMR</a>
	</nav>
	{@render children()}
	<output data-testid="route-diagnostics">{diagnostics.join('\n')}</output>
</div>

<style>
	.lifecycle-shell {
		max-width: 900px;
		margin: 40px auto;
		padding: 24px;
		font-family: system-ui;
		color: #222;
		background: #f6f4eb;
	}
	nav {
		display: flex;
		gap: 24px;
		margin-bottom: 32px;
	}
	output {
		display: block;
		white-space: pre-wrap;
		font-size: 12px;
		margin-top: 24px;
		color: #954b32;
	}
	:global(::view-transition-group(*)) {
		animation-duration: 180ms;
	}
</style>
