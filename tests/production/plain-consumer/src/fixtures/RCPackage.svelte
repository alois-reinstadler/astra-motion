<script lang="ts">
	import {
		motion,
		Reorder,
		AnimatePresence,
		useAnimate,
		useFollowValue,
		useWillChange,
		motionStore,
		animateView
	} from 'astra-motion';
	let distance = $state(20);
	let items = $state([1, 2]);
	let selected = $state('Alpha');
	let settlement = $state('pending');
	let viewOutcome = $state('pending');
	let viewLabel = $state('Before');
	const followed = useFollowValue(() => distance, { type: 'tween', duration: 0.04 });
	const readable = motionStore(followed);
	const willChange = useWillChange();
	const panel = motion.bind(() => ({
		initial: false,
		animate: { x: distance },
		transition: { duration: 0.04 },
		style: { willChange }
	}));
	const [scope, animate] = useAnimate();
	function update() {
		distance = 80;
		selected = 'Beta';
	}
	async function stop() {
		const run = animate('[data-rc-play]', { opacity: 0.2 }, { duration: 5 });
		run.stop();
		const outcome = await run.settled;
		settlement = outcome.status === 'finished' ? outcome.status : outcome.reason;
	}
	async function capture() {
		viewOutcome = 'pending';
		const builder = animateView(
			() => {
				viewLabel = 'After';
			},
			{ duration: 0.04, reducedMotion: 'never' }
		)
			.add('[data-rc-view]')
			.new({ opacity: [0, 1] });
		await builder;
		viewOutcome = await builder.finished;
	}
</script>

<section data-rc-package {@attach scope.attach}>
	<button onclick={update}>RC update</button>
	<button onclick={stop}>RC stop</button>
	<button onclick={capture}>RC view</button>
	<div data-rc-native {...panel.props}>Native modern binding</div>
	<output data-rc-follow>{$readable}</output>
	<output data-rc-settled>{settlement}</output>
	<div data-rc-play>Scoped animation</div>
	<AnimatePresence value={selected} mode="wait">
		{#snippet children(item)}<motion.p
				data-rc-item
				exit={{ opacity: 0 }}
				transition={{ duration: 0.04 }}>{item}</motion.p
			>{/snippet}
	</AnimatePresence>
	<div data-rc-view>{viewLabel}</div>
	<output data-rc-view-outcome>{viewOutcome}</output>
</section>

<Reorder.Group bind:values={items} style="width:180px;padding:0;list-style:none">
	{#each items as item (item)}
		<Reorder.Item
			value={item}
			data-rc-reorder={item}
			style="height:50px;touch-action:none;background:#eee">Item {item}</Reorder.Item
		>
	{/each}
</Reorder.Group>
<output data-rc-order>{items.join(',')}</output>
