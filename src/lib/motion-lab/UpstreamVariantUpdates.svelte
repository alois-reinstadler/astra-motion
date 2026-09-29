<!-- Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { motion } from '../motion/index.js';
	let {
		scenario = 'fallback',
		onUpdate,
		onComplete
	}: {
		scenario?: 'fallback' | 'replay' | 'hover';
		onUpdate?: (lane: string, value: number) => void;
		onComplete?: (lane: string) => void;
	} = $props();
	let label = $state<string | undefined>('a');
	let base = $state(0.2),
		inherited = $state(40),
		version = $state(0),
		hovered = $state(false),
		pressed = $state(false);
	let own = $state('one');
	const fallback = { hidden: {}, a: { opacity: 1, x: 100 }, b: { opacity: 0.4 } };
	const stable = { a: { rotateZ: [0, 40, 0] }, b: { rotateZ: [0, 40, 0] } };
	export function select(next: string | undefined) {
		label = next;
	}
	export function style(next: number) {
		base = next;
	}
	export function changeInherited(next: number) {
		inherited = next;
	}
	export function changeOwn() {
		own = 'two';
	}
	export function rerender() {
		version++;
	}
</script>

{#if scenario === 'fallback'}
	<motion.div initial="hidden" animate={label}>
		<motion.div
			data-upstream-variant="fallback"
			variants={fallback}
			style={{ opacity: base, x: 0 }}
			transition={{ type: false }}
		/>
		<motion.div
			data-upstream-variant="inherited"
			variants={{ a: { x: inherited }, b: {} }}
			style={{ x: 0 }}
			transition={{ type: false }}
		/>
		<motion.div
			data-upstream-variant="explicit"
			initial="one"
			animate={own}
			variants={{ one: { x: 10 }, two: { x: 70 } }}
			transition={{ type: false }}
		/>
	</motion.div>
{:else if scenario === 'replay'}
	<motion.div
		data-upstream-variant="stable"
		data-version={version}
		initial={{ rotateZ: 0 }}
		animate={label}
		variants={stable}
		transition={{ duration: 0.18, ease: 'linear' }}
		onUpdate={(v) => onUpdate?.('stable', Number(v.rotateZ))}
		onAnimationComplete={() => onComplete?.('stable')}
	/>
	<motion.div
		data-upstream-variant="inline"
		initial={{ rotateZ: 0 }}
		animate={label}
		variants={version >= 0 ? { a: { rotateZ: [0, 40, 0] }, b: { rotateZ: [0, 40, 0] } } : stable}
		transition={{ duration: 0.18, ease: 'linear' }}
		onUpdate={(v) => onUpdate?.('inline', Number(v.rotateZ))}
		onAnimationComplete={() => onComplete?.('inline')}
	/>
{:else}
	<motion.div
		data-upstream-variant="hover-parent"
		data-pressed={pressed}
		animate={[label ?? 'a', ...(hovered ? [`${label}-hover`] : [])]}
		transition={{ type: false }}
		onHoverStart={() => {
			hovered = true;
		}}
		onHoverEnd={() => {
			hovered = false;
		}}
		onTapStart={() => {
			pressed = true;
		}}
		onTap={() => {
			pressed = false;
		}}
		onTapCancel={() => {
			pressed = false;
		}}
	>
		<motion.div
			data-upstream-variant="trigger"
			onTap={() => {
				label = 'b';
			}}
			variants={{ b: { backgroundColor: 'rgb(0, 255, 255)' } }}
			style={{ width: 60, height: 60 }}
		>
			<motion.div
				data-upstream-variant="paint"
				style={{ backgroundColor: 'rgb(255, 255, 0)', width: 20, height: 20 }}
				variants={{
					'a-hover': { backgroundColor: 'rgb(150, 150, 0)' },
					b: { backgroundColor: 'rgb(0, 255, 255)' },
					'b-hover': { backgroundColor: 'rgb(0, 150, 150)' }
				}}
				transition={{ type: false }}
			/>
		</motion.div>
	</motion.div>
{/if}
