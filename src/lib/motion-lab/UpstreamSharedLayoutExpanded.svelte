<!-- Motion v13.4.4 adaptation; tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { AnimatePresence, LayoutGroup, motion, type MotionProps } from '../motion/index.js';
	import Namespace from './UpstreamLayoutExpandedNode.svelte';
	let {
		mode = true,
		topology = 'replace',
		scenario = 'matrix',
		duration = 0.6,
		crossfade = true,
		namespace = 'named',
		report = () => {}
	}: {
		mode?: MotionProps['layout'];
		topology?: 'replace' | 'retain';
		scenario?: string;
		duration?: number;
		crossfade?: boolean;
		namespace?: string;
		report?: (event: string) => void;
	} = $props();
	let selected = $state(untrack(() => (scenario === 'empty' ? -1 : 0)));
	let mounted = $state(true);
	let version = $state(0);
	let instant = $state(false);
	let dependency = $state(0);
	let detachedId = $state<number | undefined>();
	const hold = (p: number) => (p < 1 ? 0.5 : 1);
	const active = $derived(
		selected < 0 ? [] : topology === 'retain' && selected === 1 ? [0, 1] : [selected]
	);
	export function detachLayout(id: number) {
		detachedId = id;
	}
	export function select(value: number) {
		selected = value;
	}
	export function remove() {
		mounted = false;
	}
	export function mount(value: number) {
		selected = value;
		mounted = true;
	}
	export function update() {
		version++;
	}
	export function unlock() {
		dependency++;
	}
	export function setInstant(value: boolean) {
		instant = value;
	}
	const template = (_values: unknown, generated: string) => `translate(-50%, -50%) ${generated}`;
	function box(id: number) {
		const same = scenario === 'same-aspect';
		const fixed = scenario === 'same-position';
		return {
			position: 'absolute' as const,
			left: scenario === 'template' ? '50%' : fixed ? 0 : id * 200,
			top:
				scenario === 'template'
					? '50%'
					: scenario === 'fragment'
						? 100 + id * 200
						: fixed
							? 0
							: id * 100,
			width: id ? 300 : 100,
			height: id ? (same ? 600 : 300) : 200,
			borderRadius: scenario === 'radius' ? (id ? 40 : 10) : 0,
			opacity: scenario === 'lightbox' ? 0.8 : 1,
			rotate: scenario === 'rotate' ? (id ? 20 : -10) : 0
		};
	}
</script>

<div style="position:relative;width:700px;height:650px">
	{#if scenario === 'namespace'}
		<Namespace
			id="source"
			bridge={namespace === 'unnamed-bridge'}
			direct={namespace === 'direct'}
			inherit={namespace === 'inherit-false' ? false : namespace === 'inherit-id' ? 'id' : true}
			parentId={namespace === 'unnamed-parent' ? undefined : 'outer'}
			childId={namespace === 'unnamed-child' ? undefined : 'inner'}
			show={selected === 0}
		/>
		<Namespace
			id="destination"
			direct={namespace === 'direct'}
			inherit={namespace === 'inherit-false' ? false : namespace === 'inherit-id' ? 'id' : true}
			parentId={namespace === 'unnamed-parent'
				? undefined
				: ['inherit-false', 'separate-parents'].includes(namespace)
					? 'different-parent'
					: 'outer'}
			childId={namespace === 'unnamed-child'
				? undefined
				: namespace === 'different'
					? 'other'
					: 'inner'}
			show={selected === 1}
			left={200}
		/>
	{:else if scenario === 'dependency'}
		{#key `${selected}:${dependency}`}
			<motion.div
				data-shared-box={selected}
				layoutId="dependency-card"
				layoutDependency={dependency}
				transition={{ duration, ease: hold }}
				onLayoutAnimationStart={() => report(`start:${selected}`)}
				onLayoutAnimationComplete={() => report(`complete:${selected}`)}
				style={{
					position: 'absolute',
					left: selected * 200 + dependency * 200,
					top: 0,
					width: 100,
					height: 100
				}}
			/>
		{/key}
	{:else}
		<LayoutGroup id="upstream-shared">
			<motion.div
				data-shared-parent
				style={{
					position: 'relative',
					width: scenario === 'template' ? 500 : 600,
					height: scenario === 'template' ? 500 : 600,
					x: scenario === 'percentage' ? '25%' : scenario === 'translation' ? 50 : 0,
					y: scenario === 'translation' ? 40 : 0
				}}
			>
				{#if mounted}
					<AnimatePresence
						items={active}
						key={(id) => id}
						initial={false}
						onExitComplete={scenario === 'presence-detach'
							? () => report('presence-complete')
							: undefined}
					>
						{#snippet children(id)}
							<div style={scenario === 'contents' ? 'display:contents' : ''}>
								<motion.div
									data-shared-box={id}
									data-shared-layout={detachedId !== id}
									layout={detachedId === id ? false : mode}
									layoutId={detachedId === id ? undefined : 'card'}
									exit={scenario === 'presence-detach' ? 'leave' : undefined}
									variants={scenario === 'presence-detach'
										? {
												shown: { opacity: 1 },
												leave: { opacity: 0, transition: { duration: 0.35, ease: 'linear' } }
											}
										: undefined}
									onAnimationComplete={(definition) => {
										if (definition === 'leave') report(`exit:${id}`);
									}}
									layoutDependency={scenario === 'dependency' ? dependency : undefined}
									layoutCrossfade={crossfade}
									transformTemplate={scenario === 'template' ? template : undefined}
									animate={scenario === 'presence-detach'
										? 'shown'
										: scenario === 'scale-read'
											? selected === 1 && version === 0
												? { scale: 2 }
												: {}
											: scenario === 'presence-retention'
												? { opacity: id ? 0.5 : 1 }
												: undefined}
									transition={{ duration: instant ? 0 : duration, ease: hold }}
									onLayoutAnimationStart={() => report(`start:${id}`)}
									onLayoutAnimationComplete={() => report(`complete:${id}`)}
									style={box(id)}
								>
									{#if ['nested', 'contents', 'lightbox'].includes(scenario)}
										<motion.div
											data-shared-child={id}
											layout
											layoutId="child"
											transition={{ duration: instant ? 0 : duration, ease: hold }}
											style={{
												position: 'absolute',
												left: 0,
												top: 0,
												width: 50,
												height: 50,
												borderRadius: 25,
												opacity: 0.5
											}}
										/>
									{/if}
									{version}
								</motion.div>
							</div>
						{/snippet}
					</AnimatePresence>
				{/if}
				{#if scenario === 'persistent-sibling'}<motion.div
						layout
						style={{ position: 'absolute', top: 500, width: 40, height: 40 }}
					/>{/if}
			</motion.div>
		</LayoutGroup>
	{/if}
</div>
