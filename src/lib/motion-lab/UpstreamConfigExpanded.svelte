<script lang="ts">
	// Motion v13.4.4 (33f6e72); see tests/motion-baseline/LICENSE.motion.
	import { motion, MotionConfig, useMotionValue } from '../motion/index.js';
	let { mode = 'inherit' }: { mode?: string } = $props();
	let running = $state(false);
	const replacement = useMotionValue(0);
	const inherited = useMotionValue(0);
	const overridden = useMotionValue(0);
	const providerX = useMotionValue(0),
		providerY = useMotionValue(0);
	const localX = useMotionValue(0),
		localY = useMotionValue(0);
	export function start() {
		running = true;
	}
	export function values() {
		return { replacement, inherited, overridden, providerX, providerY, localX, localY };
	}
</script>

{#if mode === 'inherit'}
	<MotionConfig transition={{ type: false, duration: 5, ease: () => 0 }}>
		<MotionConfig transition={{ duration: 0.35 }}>
			<motion.div
				data-case="replacement"
				animate={{ x: running ? 100 : 0 }}
				style={{ x: replacement }}
			/>
		</MotionConfig>
		<MotionConfig transition={{ inherit: true }}>
			<motion.div
				data-case="inherited"
				animate={{ x: running ? 100 : 0 }}
				style={{ x: inherited }}
			/>
		</MotionConfig>
		<MotionConfig transition={{ inherit: true, type: 'tween', duration: 0.35, ease: 'linear' }}>
			<MotionConfig transition={{ inherit: true, delay: 0.2 }}>
				<motion.div
					data-case="overridden"
					animate={{ x: running ? 100 : 0 }}
					style={{ x: overridden }}
				/>
			</MotionConfig>
		</MotionConfig>
	</MotionConfig>
{:else}
	<MotionConfig transition={{ x: { type: false }, y: { duration: 0.35, ease: 'linear' } }}>
		<motion.div
			data-case="provider"
			animate={{ x: running ? 100 : 0, y: running ? 100 : 0 }}
			style={{ x: providerX, y: providerY }}
		/>
		<motion.div
			data-case="local"
			animate={{ x: running ? 100 : 0, y: running ? 100 : 0 }}
			style={{ x: localX, y: localY }}
			transition={{ y: { type: false }, x: { duration: 0.35, ease: 'linear' } }}
		/>
	</MotionConfig>
{/if}
