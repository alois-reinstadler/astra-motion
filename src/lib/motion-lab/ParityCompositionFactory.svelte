<script lang="ts">
	import { motion, motionValue } from '../motion/index.js';
	import CustomButton from './ParityCompositionButton.svelte';
	const Input = motion.create('input');
	const Circle = motion.create('circle');
	const Button = motion.create(CustomButton);
	const text = motionValue(10);
	const replacement = motionValue('Replaced');
	let replace = $state(false);
	let count = $state(0);
	let input = $state<HTMLInputElement | null>();
	let circle = $state<SVGCircleElement | null>();
	let button = $state<HTMLElement | SVGElement | null>();
	let attached: Element | undefined;
	let detached = 0;
	function attach(node: Element) {
		attached = node;
		return () => {
			detached++;
			attached = undefined;
		};
	}
	export function inspect() {
		return { input, circle, button, attached, detached, count };
	}
	export function update(value: number) {
		text.set(value);
	}
	export function replaceChild() {
		replace = true;
	}
</script>

<Input
	data-composition-input
	type="email"
	required
	defaultValue="example@astra.test"
	bind:ref={input}
	initial={{ opacity: 0.5 }}
	animate={{ opacity: 1 }}
	transition={{ duration: 0 }}
/>
<svg viewBox="0 0 100 100" aria-label="Factory circle">
	<Circle
		data-composition-circle
		cx={25}
		cy={35}
		r={12}
		fill="blue"
		stroke-width={2}
		bind:ref={circle}
		initial={false}
	/>
</svg>
<Button
	data-composition-button
	label="Increment composition count"
	bind:count
	bind:ref={button}
	{@attach attach}
	children={replace ? replacement : text}
	initial={false}
/>
