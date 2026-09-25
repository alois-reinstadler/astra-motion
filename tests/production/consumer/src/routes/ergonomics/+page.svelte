<script lang="ts">
	import {
		motion,
		Motion,
		MotionConfig,
		createMotion,
		createAnimate,
		type AnimationSettlement
	} from 'astra-motion';
	let text = $state('hello');
	let amount = $state<number | null>(12);
	let checked = $state(false);
	let ref = $state<HTMLButtonElement | null>();
	let clicks = $state(0);
	let inputEvents = $state(0);
	let eventTag = $state('');
	let visible = $state(true);
	let options = $state({ initial: false as const, animate: { x: 0 }, transition: { duration: 0 } });
	const direct = createMotion(options);
	const getter = createMotion(() => options);
	let reduced = $state(false);
	let outcome = $state<AnimationSettlement>();
	const scope = createAnimate(() => ({ reducedMotion: reduced ? 'always' : 'never' }));
	async function play() {
		outcome = undefined;
		const controls = scope.animate('[data-timeline]', { opacity: [1, 0.25] }, { duration: 10 });
		outcome = await controls.settled;
	}
</script>

<h1>Packed ergonomics</h1>
<Motion
	as="button"
	type="button"
	animate={{ opacity: 1 }}
	style={{ color: 'green' }}
	onclick={(event) => event.currentTarget.checkValidity()}>Generic flat action</Motion
>
<MotionConfig transition={{ duration: 0 }}>
	<motion.input
		aria-label="Text"
		bind:value={text}
		oninput={(event) => {
			inputEvents++;
			eventTag = event.currentTarget.tagName;
		}}
	/>
	<motion.input aria-label="Amount" type="number" bind:value={amount} />
	<motion.input aria-label="Checked" type="checkbox" bind:checked />
	{#if visible}
		<motion.button
			bind:ref
			initial={false}
			animate={{ opacity: 1 }}
			style={{ color: clicks ? 'blue' : 'red' }}
			type="button"
			onclick={(event) => {
				clicks++;
				eventTag = event.currentTarget.tagName;
			}}>Native action</motion.button
		>
	{/if}
	<button
		onclick={() => {
			text = 'parent update';
			amount = 7;
			checked = true;
		}}>Update bindings</button
	>
	<button onclick={() => (visible = !visible)}>Toggle native action</button>
	<output data-bindings
		>{JSON.stringify({
			text,
			amount,
			checked,
			clicks,
			inputEvents,
			eventTag,
			tag: ref?.tagName ?? null
		})}</output
	>
	<motion.div
		data-nested
		initial={options.initial}
		animate={options.animate}
		transition={options.transition}>Nested reactive target</motion.div
	>
	<div data-nested-direct {...direct.props}>Direct options</div>
	<div data-nested-getter {...getter.props}>Getter options</div>
	<button onclick={() => (options.animate.x = 80)}>Change nested target</button>
	<button onclick={() => (options.animate = { x: 160 })}>Replace nested target</button>
	<motion.section initial={false} animate="open" variants={{ open: { opacity: 1 } }}>
		<motion.div data-inherited variants={{ open: { opacity: 0.65, x: 24 } }}
			>Inherited SSR pose</motion.div
		>
	</motion.section>
</MotionConfig>
<section {@attach scope.attach}>
	<div data-timeline>Timeline target</div>
	<button onclick={play}>Play timeline</button>
	<button onclick={() => scope.stop()}>Stop timeline</button>
	<button aria-pressed={reduced} onclick={() => (reduced = !reduced)}>Toggle reduced motion</button>
	<output data-outcome>{JSON.stringify(outcome)}</output>
</section>
