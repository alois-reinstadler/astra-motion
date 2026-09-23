<script lang="ts">
	import { routeTransitions } from 'astra-motion/routes';
	let { children } = $props();
	routeTransitions({ onDiagnostic: (message) => console.warn(message) });
</script>

{@render children()}

<style>
	:global(body) {
		font: 16px system-ui;
		margin: 24px;
	}
	:global(section) {
		border-top: 1px solid #ddd;
		padding: 12px 0;
	}
	:global(button) {
		margin: 3px;
		padding: 6px;
	}
	:global(.tile) {
		width: 160px;
		background: #dce;
	}
</style>
