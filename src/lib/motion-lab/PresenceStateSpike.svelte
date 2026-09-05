<script lang="ts">
	import { visualElementStore, type HTMLVisualElement } from 'motion-dom';
	import { createLayout } from '../motion/layout.js';
	import { createPresenceTimeline, type PresenceTimeline } from '../motion/presence-state.js';
	let open = $state(false);
	let end = $state(false);
	const layout = createLayout({ transition: { duration: 0.5, ease: 'linear' } });
	const timelines = new WeakMap<HTMLElement, PresenceTimeline>();
	function presence(node: HTMLElement) {
		return ({ direction }: { direction: 'in' | 'out' } = { direction: 'in' }) => {
			const visual = visualElementStore.get(node) as HTMLVisualElement;
			const previous = timelines.get(node);
			if (!previous && direction === 'in') {
				visual.getValue('opacity', 0).jump(0);
				visual.getValue('scale', 0.6).jump(0.6);
				visual.getValue('y', -20).jump(-20);
			}
			previous?.cancel();
			const timeline = createPresenceTimeline(
				visual,
				{ ...visual.latestValues },
				direction === 'in' ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.85, y: 35 },
				{ duration: 0.4, ease: 'linear' },
				direction,
				{},
				previous ? () => previous.progress : undefined
			);
			timelines.set(node, timeline);
			return timeline;
		};
	}
</script>

<button onclick={() => (open = !open)}>Toggle asymmetric</button>
<button onclick={() => (end = !end)}>Move asymmetric</button>
<div style:justify-content={end ? 'flex-end' : 'flex-start'} class="track">
	{#if open}
		<div data-testid="presence-state" {@attach layout()} transition:presence class="item"></div>
	{/if}
</div>

<style>
	.track {
		display: flex;
		width: 400px;
		height: 100px;
	}
	.item {
		width: 100px;
		height: 100px;
		background: royalblue;
	}
</style>
