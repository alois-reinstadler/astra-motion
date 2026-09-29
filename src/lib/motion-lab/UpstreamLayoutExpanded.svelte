<!-- Motion v13.4.4 adaptation; tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import {
		AnimatePresence,
		LayoutGroup,
		motion,
		useAnimate,
		useMotionValue
	} from '../motion/index.js';
	let {
		scenario = 'axis',
		mode = true,
		report = () => {},
		anchor,
		percentage = false
	}: {
		scenario?: string;
		mode?: boolean | 'x' | 'y' | 'position' | 'size' | 'preserve-aspect';
		report?: (event: string) => void;
		anchor?: { x: number; y: number } | false;
		percentage?: boolean;
	} = $props();
	let expanded = $state(false);
	let childShift = $state(false);
	let count = $state(0);
	let visible = $state(true);
	let dependency = $state(0);
	let entries = $state([0]);
	let raceItems = $state([0, 1]);
	export function addRaceItem() {
		raceItems = [...raceItems, raceItems.length];
	}
	const value = useMotionValue(0);
	const [, play] = useAnimate();
	const samples: number[] = [];
	onDestroy(value.on('change', (v) => samples.push(v)));
	export function change(next = !expanded) {
		expanded = next;
	}
	export function moveChild() {
		childShift = !childShift;
	}
	export function rerender() {
		count++;
	}
	export function hide() {
		visible = false;
	}
	export function unlock() {
		dependency++;
	}
	export function add() {
		entries = [...entries, entries.length];
	}
	export function remove() {
		entries = entries.slice(0, -1);
	}
	export function undo() {
		expanded = true;
		expanded = false;
	}
	export function microtask() {
		queueMicrotask(() => {
			expanded = !expanded;
		});
	}
	export function animate() {
		expanded = !expanded;
		return play(value, 100, { duration: 0.2, ease: 'linear' });
	}
	export function read() {
		return { samples: [...samples], value: value.get() };
	}
	const hold = (p: number) => (p < 1 ? 0.5 : 1);
	const transition = { duration: 0.6, ease: hold };
	function portal(element: HTMLElement) {
		document.body.append(element);
		return () => element.remove();
	}
	const identity = untrack(() =>
		scenario === 'identity' ? { x: 0, y: 0, scale: 1, rotate: 0 } : undefined
	);
</script>

{#if scenario === 'identity' || scenario === 'no-transform'}
	<motion.div
		data-expanded-parent
		animate={identity}
		style={{ position: 'absolute', left: 150, top: 150 }}
		><div data-expanded-fixed style="position:fixed;top:10px;left:10px;width:20px;height:20px">
			{count}
		</div></motion.div
	>
{:else if scenario === 'anchor'}
	<motion.div
		data-expanded-parent
		layout
		transition={{ duration: 1, ease: 'linear' }}
		style={{
			position: 'relative',
			width: expanded ? 300 : 100,
			height: expanded ? 300 : 100,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center'
		}}
	>
		<motion.div
			data-expanded-box
			layout
			layoutAnchor={anchor}
			transition={{ duration: 1, ease: 'linear', delay: 0.5 }}
			style={{ width: 20, height: 20 }}
		/>
	</motion.div>
{:else if scenario === 'relative' || scenario === 'delay' || scenario === 'drag' || scenario === 'unmount'}
	<LayoutGroup>
		{#if scenario !== 'unmount' || visible}<motion.div
				data-expanded-expander
				layout
				{transition}
				style={{ height: expanded ? 120 : 20, width: 200 }}
			/>{/if}
		<motion.div
			data-expanded-parent
			layout
			drag={scenario === 'drag'}
			dragMomentum={false}
			{transition}
			style={{ position: 'relative', width: expanded ? 300 : 200, height: 200 }}
		>
			<motion.div
				data-expanded-box
				layout
				transition={{ ...transition, delay: scenario === 'delay' ? 0.08 : 0 }}
				onLayoutAnimationComplete={() => report('child-complete')}
				style={{
					position: 'relative',
					left: childShift ? 60 : 0,
					top: childShift ? 60 : 0,
					width: 100,
					height: 100
				}}
			/>
		</motion.div>
	</LayoutGroup>
{:else if scenario === 'resize'}
	<div style="position:relative;width:600px;height:400px">
		<motion.div
			data-expanded-parent
			layout
			transition={{ duration: 1.2, ease: hold }}
			style={{
				position: 'absolute',
				left: expanded ? 100 : 0,
				top: expanded ? 100 : 0,
				width: expanded ? 400 : 100,
				height: expanded ? 200 : 100
			}}
		>
			<motion.div
				data-expanded-box
				layout
				transition={{ duration: 1.2, ease: hold }}
				style={{ width: 100, height: 100 }}
			/>
		</motion.div>
	</div>
{:else if scenario === 'anchored-unmount'}
	<div style="position:relative;width:220px;height:500px">
		<LayoutGroup id="anchored-list">
			<motion.div style={{ position: 'absolute', left: 20, bottom: 20 }}>
				<motion.div
					data-expanded-parent
					layout
					layoutId="stack"
					{transition}
					style={{ width: 'min-content', height: 'min-content' }}
				>
					<motion.div
						style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}
					>
						{#if visible}<LayoutGroup id="items"
								><motion.div
									layout
									layoutId="removed"
									{transition}
									style={{ width: 100, height: 100, margin: 20 }}
								/></LayoutGroup
							>{/if}
						<LayoutGroup id="items"
							><motion.div
								data-expanded-box
								layout
								layoutId="survivor"
								{transition}
								style={{ width: 100, height: 100, margin: 20 }}
							/></LayoutGroup
						>
					</motion.div>
				</motion.div>
			</motion.div>
		</LayoutGroup>
	</div>
{:else if scenario === 'portal'}
	<motion.div
		data-expanded-parent
		layout
		{transition}
		style={{ width: expanded ? 200 : 100, height: expanded ? 200 : 100 }}
	>
		<motion.div
			data-expanded-box
			{@attach portal}
			layout
			{transition}
			style={{ position: 'absolute', left: 0, top: expanded ? 200 : 100, width: 100, height: 100 }}
		/>
	</motion.div>
{:else if scenario === 'new-entry'}
	<motion.div
		data-expanded-parent
		layout
		{transition}
		style={{ display: 'flex', width: 400, position: 'relative', left: expanded ? 100 : 0 }}
	>
		{#each entries as id (id)}<motion.div
				data-expanded-entry={id}
				layout
				{transition}
				style={{ width: 160, height: 100, flexShrink: 0, marginRight: 10 }}>{id}</motion.div
			>{/each}
	</motion.div>
{:else if scenario === 'percent-race'}
	<div
		data-percent-row
		style="display:flex;justify-content:center;gap:10px;width:600px;position:relative"
	>
		{#each raceItems as id, index (id)}
			{@const shouldAnimate = id >= 2 && index === raceItems.length - 1}
			<motion.div
				data-percent-item={id}
				data-percent-animated={shouldAnimate}
				layout
				initial={shouldAnimate ? { x: '100%' } : undefined}
				animate={shouldAnimate ? { x: 0 } : undefined}
				transition={{ duration: 10, ease: 'linear' }}
				layoutTransition={{ duration: 0.4, ease: hold }}
				onLayoutAnimationStart={() => report(`percent-start:${id}`)}
				onLayoutAnimationComplete={() => report(`percent-complete:${id}`)}
				style={{ width: 100, height: 100, flexShrink: 0 }}
			/>
		{/each}
	</div>
{:else if scenario === 'dependency-exit' || scenario === 'exit'}
	<LayoutGroup>
		<motion.div
			data-expanded-parent
			layout
			layoutDependency={dependency}
			{transition}
			style={{ width: expanded ? 300 : 100, height: expanded ? 300 : 100 }}
		>
			<AnimatePresence present={visible} onExitComplete={() => report('exit')}>
				<motion.div
					data-expanded-box
					layout
					layoutDependency={dependency}
					initial={false}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
					style={{ width: 100, height: 100 }}
				/>
			</AnimatePresence>
		</motion.div>
	</LayoutGroup>
{:else}
	<div style="position:relative;width:600px;height:500px">
		<motion.div
			data-expanded-parent
			layout={scenario === 'parent-rerender'}
			{transition}
			style={{
				width: 500,
				height: scenario === 'parent-rerender' && expanded ? 500 : 400,
				position: 'relative'
			}}
		>
			<motion.div
				data-expanded-box
				layout={mode}
				layoutDependency={scenario === 'dependency' ? dependency : undefined}
				{transition}
				onLayoutAnimationStart={() => report('start')}
				onLayoutAnimationComplete={() => report('complete')}
				style={{
					position: 'absolute',
					left: expanded ? 200 : 0,
					top: expanded ? 100 : 0,
					width: expanded ? 300 : 100,
					height: expanded ? 300 : 200
				}}>{count}{percentage ? '%' : ''}</motion.div
			>
		</motion.div>
	</div>
{/if}
