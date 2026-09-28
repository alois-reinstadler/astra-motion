<script lang="ts">
	import { motion, motionValue, AnimatePresence } from '../motion/index.js';
	import CustomButton from './ParityCustomButton.svelte';
	const Button = motion.create(CustomButton);
	const Tag = motion.create('astra-card');
	let visible = $state(true);
	let count = $state(0);
	let ref = $state<HTMLElement | SVGElement | null>();
	const text = motionValue(10);
	const other = motionValue('ready');
	let useOther = $state(false);
	export function updateText(value: number) {
		text.set(value);
	}
	export function replaceText() {
		useOther = true;
	}
	export function hide() {
		visible = false;
	}
	export function inspect() {
		return { count, ref, text, other };
	}
</script>

<AnimatePresence present={visible}>
	<Button
		label="Custom motion button"
		bind:count
		bind:ref
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		exit={{ opacity: 0 }}
		transition={{ duration: 0.12 }}
		data-custom>Child</Button
	>
</AnimatePresence>
<Tag data-custom-tag initial={false} animate={{ opacity: 0.8 }}>Custom element</Tag>
<motion.span data-value-text children={useOther ? other : text} />
<motion.svg viewBox="0 0 100 100" width={100} height={100}>
	<motion.title>SVG title</motion.title>
	<motion.a href="#custom" data-svg-link><motion.text y={20} children={text} /></motion.a>
	<motion.foreignObject width={100} height={40} y={40}
		><motion.button data-html-child>HTML child</motion.button></motion.foreignObject
	>
</motion.svg>
