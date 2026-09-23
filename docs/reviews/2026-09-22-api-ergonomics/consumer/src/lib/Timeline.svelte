<script lang="ts">
	import { createAnimate, createMotion } from 'astra-motion';
	let reduce = $state(false);
	let status = $state('idle');
	let conflict = $state('');
	let active = $state(true);
	const scope = createAnimate(() => ({ reducedMotion: reduce ? 'always' : 'never' }));
	const owned = createMotion({ animate: { opacity: 1 } });
	function play() {
		status = 'running';
		const controls = scope.sequence([
			['.tile', { x: 120 }, { duration: 2 }],
			['.tile', { x: 0 }, { duration: 0.2 }]
		]);
		void controls.then(() => (status = 'resolved'));
	}
	function overlap() {
		try {
			scope.animate('.owned', { opacity: 0.5 }, { duration: 0.1 });
		} catch (error) {
			conflict = String(error);
		}
	}
</script>

<section>
	<h2>Timeline</h2>
	<button id="play" onclick={play}>Play timeline</button><button
		id="stop"
		onclick={() => scope.stop()}>Stop timeline</button
	><button id="timeline-reduce" onclick={() => (reduce = !reduce)}>Set local reduced motion</button
	><button id="timeline-remove" onclick={() => (active = !active)}>Remove scope</button><button
		id="conflict"
		onclick={overlap}>Animate owned opacity</button
	>
	<p id="timeline-status">{status}</p>
	<p id="ownership-error">{conflict}</p>
	{#if active}<div {@attach scope.attach}>
			<div class="tile" id="tile">Timeline tile</div>
			<div class="owned" {...owned.props}>Owned state element</div>
		</div>{/if}
</section>
