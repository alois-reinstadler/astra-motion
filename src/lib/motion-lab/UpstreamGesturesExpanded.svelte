<!-- Motion 13.4.4, 33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343. See tests/motion-baseline attribution. -->
<script lang="ts">
	import { motion, useMotionValue, type PanInfo } from '../motion/index.js';
	let {
		mode = 'hover',
		report = () => {}
	}: { mode?: string; report?: (name: string, info?: PanInfo) => void } = $props();
	let revision = $state('old');
	let enabled = $state(true);
	let active = $state(false);
	let isolated = $state(false);
	let dragging = $state(false);
	const x = useMotionValue(0);
	export function configure(next: {
		revision?: string;
		enabled?: boolean;
		active?: boolean;
		isolated?: boolean;
		dragging?: boolean;
	}) {
		if (next.revision !== undefined) revision = next.revision;
		if (next.enabled !== undefined) enabled = next.enabled;
		if (next.active !== undefined) active = next.active;
		if (next.isolated !== undefined) isolated = next.isolated;
		if (next.dragging !== undefined) dragging = next.dragging;
	}
	const variants = {
		base: { opacity: 0.2, transition: { type: false as const } },
		hover: { opacity: 0.6, transition: { type: false as const }, transitionEnd: { opacity: 0.8 } },
		pressed: { opacity: 1 },
		visible: { opacity: 0.9 }
	};
</script>

{#if mode === 'focus'}
	<motion.button
		data-testid="target"
		initial="base"
		whileFocus="hover"
		{variants}
		transition={{ type: false }}>Focus</motion.button
	>
{:else if mode === 'hover' || mode === 'priority'}
	<motion.div
		data-testid="target"
		initial={mode === 'priority' ? { opacity: 0.2, scale: 1 } : 'base'}
		whileHover={mode === 'priority' ? { opacity: 0.6, scale: 0.5 } : 'hover'}
		whileTap={mode === 'priority' ? { scale: 2 } : undefined}
		{variants}
		transition={mode === 'priority' ? { type: false } : { duration: 0.5 }}
		drag={dragging ? 'x' : false}
		dragMomentum={false}
		onHoverStart={() => report('hover:start')}
		onHoverEnd={() => report('hover:end')}
		style={{ x, width: 100, height: 100 }}
	>
		<motion.div
			data-testid="child"
			initial={{ opacity: 0.3 }}
			variants={{ hover: { opacity: 0.7 } }}
			transition={{ type: false }}
		/>
	</motion.div>
{:else if mode === 'pan'}
	<motion.div
		data-testid="target"
		style={{ width: 100, height: 100 }}
		onPanStart={(_, info) => report(`${revision}:start`, info)}
		onPan={(_, info) => report(`${revision}:pan`, info)}
		onPanEnd={(_, info) => report(`${revision}:end`, info)}
	/>
{:else if mode === 'disabled'}
	<motion.button
		data-testid="target"
		disabled
		whileTap={{ opacity: 0.1 }}
		initial={{ opacity: 1 }}
		transition={{ type: false }}
		onTapStart={() => report('start')}
		onTap={() => report('tap')}>Disabled</motion.button
	>
{:else if mode === 'variants'}
	<motion.div
		data-testid="parent"
		initial="base"
		animate={active ? 'visible' : 'base'}
		whileTap={active ? undefined : 'pressed'}
	>
		<motion.button
			data-testid="target"
			{variants}
			transition={{ type: false }}
			whileTap={{ opacity: 0.5 }}
			onTapStart={() => report('start')}>Local press</motion.button
		>
		<motion.div data-testid="child" {variants} transition={{ type: false }} />
	</motion.div>
{:else if mode === 'reactive-variants'}
	<motion.div animate={active ? 'visible' : 'base'} initial="base">
		<motion.button
			data-testid="target"
			{variants}
			transition={{ type: false }}
			onTapStart={() => {
				active = true;
				report('start');
			}}>Change parent</motion.button
		>
		<motion.div data-testid="child" {variants} transition={{ type: false }} />
	</motion.div>
{:else if mode === 'state'}
	<motion.button
		data-testid="target"
		initial={{ opacity: 0.2 }}
		animate={{ opacity: active ? 0.4 : 0.2 }}
		whileHover={{ opacity: active ? 0.8 : 0.6 }}
		whileTap={{ opacity: 1 }}
		transition={{ type: false }}>State</motion.button
	>
{:else if mode === 'ancestry'}
	<motion.div
		data-testid="grandparent"
		initial={{ opacity: 0.4 }}
		whileTap={{ opacity: 1 }}
		transition={{ type: false }}
		onTap={() => report('grandparent:tap')}
	>
		<motion.div
			data-testid="parent"
			initial={{ opacity: 0.5 }}
			whileTap={{ opacity: 1 }}
			transition={{ type: false }}
			drag={dragging ? 'x' : false}
			dragMomentum={false}
			onTap={() => report('parent:tap')}
		>
			<motion.div
				data-testid="target"
				initial={{ opacity: 0.6 }}
				whileTap={{ opacity: 1 }}
				transition={{ type: false }}
				propagate={{ tap: isolated ? false : undefined }}
				onTap={() => report('child:tap')}
				onTapCancel={() => report('child:cancel')}
			>
				<span data-testid="child">Child</span>
			</motion.div>
		</motion.div>
	</motion.div>
{:else}
	<motion.button
		data-testid="target"
		initial={{ opacity: 0.2 }}
		whileTap={{ opacity: 1 }}
		transition={{ type: false }}
		onTapStart={enabled ? () => report(`${revision}:start`) : undefined}
		onTap={enabled ? () => report(`${revision}:tap`) : undefined}
		onTapCancel={enabled ? () => report(`${revision}:cancel`) : undefined}>Tap</motion.button
	>
	<motion.button data-testid="child" onTap={() => report('sibling:tap')}>Sibling</motion.button>
{/if}
<button data-testid="outside" type="button">Outside</button>
