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
	export function sequence(onProgress?: (value: number) => void) {
		return animate([
			[
				'[data-composition-hybrid], [data-composition-hybrid-motion]',
				{ x: [0, 999, 200], y: [0, 999, 100], opacity: [0, 1] },
				{ path, duration: 0.4, ease: 'linear' }
			],
			'first',
			[
				'[data-composition-hybrid], [data-composition-hybrid-motion]',
				{ x: 400, y: 0 },
				{ path, at: '+0.1', duration: 0.4, ease: 'linear' }
			],
			[
				'[data-composition-hybrid-motion]',
				{ opacity: [0, 1] },
				{ at: 'first', duration: 0.2, ease: 'linear' }
			],
			[onProgress ?? (() => {}), { at: '<', duration: 0.2, ease: 'linear' }]
		]);
	}
	export function overlapSequence() {
		return animate([
			['[data-composition-hybrid]', { x: [0, 100], y: 0 }, { duration: 2, ease: 'linear' }],
			['[data-composition-hybrid]', { x: 50 }, { at: 1, duration: 0.2, ease: 'linear' }],
			[
				'[data-composition-hybrid]',
				{ x: 200, y: 100 },
				{ at: 2.2, path, duration: 0.4, ease: 'linear' }
			]
		]);
	}
	export function overlappingArcs() {
		const bend = arc({ strength: 1, direction: 'ccw' });
		return animate([
			[
				'[data-composition-hybrid]',
				{ x: [0, 100], y: [0, 0] },
				{ path: bend, duration: 2, ease: 'linear' }
			],
			[
				'[data-composition-hybrid]',
				{ x: 200, y: 0 },
				{ path: bend, at: 1, duration: 1, ease: 'linear' }
			]
		]);
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
