<script lang="ts">
	import { arc, motion, useAnimate, useMotionValue } from '../motion/index.js';
	const path = arc({ strength: 0.5, direction: 'ccw', rotate: true });
	const [scope, animate] = useAnimate();
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	let target = $state({ x: 0, y: 0 });
	export function move(next = { x: 200, y: 100 }) {
		target = next;
	}
	export function position() {
		return { x: x.get(), y: y.get() };
	}
	export function playbacks() {
		return { x: x.animation, y: y.animation };
	}
	export function stopAxis(axis: 'x' | 'y') {
		(axis === 'x' ? x : y).stop();
	}
	export function hybrid(motionElement = false, next = { x: 200, y: 100 }) {
		return animate(
			motionElement ? '[data-composition-hybrid-motion]' : '[data-composition-hybrid]',
			next,
			{ path, duration: 0.4, ease: 'linear' }
		);
	}
	export function external(element: HTMLElement) {
		return animate(element, { x: 200, y: 100 }, { path, duration: 1, ease: 'linear' });
	}
</script>

<section {@attach scope.attach}>
	<motion.div
		data-composition-path
		initial={false}
		animate={target}
		style={{ x, y, width: 20, height: 20 }}
		transition={{ path, duration: 0.4, ease: 'linear' }}
	/>
	<div
		data-composition-hybrid
		style="width: 20px; height: 20px; transform: translateX(0px) translateY(0px)"
	></div>
	<motion.div
		data-composition-hybrid-motion
		initial={false}
		style={{ x: 0, y: 0, width: 20, height: 20 }}
	/>
</section>
