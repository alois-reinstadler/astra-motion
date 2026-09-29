<!-- Motion v13.4.4 adaptation; tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { getAllContexts, mount, unmount, onDestroy, onMount } from 'svelte';
	import {
		motion,
		useMotionValue,
		useAnimationControls,
		usePresenceData,
		type Variants
	} from '../motion/index.js';
	import Manual from './UpstreamPresenceExpandedInner.svelte';
	let {
		id,
		scenario,
		inner = true,
		capture,
		report,
		css = ''
	}: {
		id: string;
		scenario: string;
		inner?: boolean;
		capture: (id: string, remove: () => void) => void;
		report: (event: string, id: string, value?: number) => void;
		css?: string;
	} = $props();
	const data = usePresenceData();
	const context = getAllContexts();
	function recordPresenceData() {
		if (scenario === 'custom') report('presence-data', id, Number(data.current));
	}
	$effect(recordPresenceData);
	// React conditionals unmount immediately. Explicit Svelte unmount without outro
	// reproduces that trigger while retaining the child's inherited presence scope.
	function mountUnregisterChild(target: HTMLElement) {
		const child = mount(motion.div, {
			target,
			context,
			props: {
				'data-expanded-inner': id,
				initial: { opacity: 1 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				transition: { duration: 10 }
			}
		});
		return () => {
			void unmount(child, { outro: false });
		};
	}
	const controls = useAnimationControls();
	const opacity = useMotionValue(1);
	onDestroy(opacity.on('change', (value) => report('value-opacity', id, value)));
	onMount(() => {
		if (scenario === 'controls') void controls.start({ x: 80 }, { duration: 0.1 });
	});
	const variants: Variants = {
		hidden: { opacity: 0, x: 0 },
		enter: (direction) => {
			report('enter-custom', id, Number(direction));
			return { opacity: 1, x: 0 };
		},
		leave: (direction) => ({ opacity: 0, x: Number(direction) * 100 }),
		shown: { opacity: 1, x: 0 },
		orchestrated: { opacity: 0, x: 100, transition: { duration: 0.12, when: 'afterChildren' } }
	};
</script>

{#if scenario === 'outside'}
	<span data-expanded-outside>{String(data.current)}</span>
{:else if scenario === 'manual' || scenario === 'pop'}
	<div data-expanded-item={id} style="display:contents">
		<Manual {id} {capture} {css} />
		{#if scenario === 'manual'}<Manual id={`${id}-second`} {capture} />{/if}
	</div>
{:else if scenario === 'plain'}
	<div data-expanded-item={id}>Plain {id}</div>
{:else if scenario === 'unregister'}
	<div data-expanded-item={id}>
		{#if inner}<div {@attach mountUnregisterChild}></div>{:else}<span>Closed</span>{/if}
	</div>
{:else if scenario === 'height'}
	<motion.div
		data-expanded-item={id}
		initial={{ height: 0 }}
		animate={{ height: 'auto' }}
		exit={{ height: 0 }}
		transition={{ duration: 0.6, ease: 'linear' }}
		style={{ overflow: 'hidden', width: 160 }}
	>
		<div style="height:100px">Panel {id}</div>
	</motion.div>
{:else if scenario === 'noop'}
	<motion.div
		data-expanded-item={id}
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		exit={{ opacity: 0 }}
		transition={{ duration: 0 }}
	>
		<motion.div initial="hidden" animate="shown" variants={{ hidden: {}, shown: {} }}>
			{#each [1, 2] as child (child)}
				<motion.div
					data-expanded-noop={child}
					variants={{ hidden: { opacity: 0, scale: 0.5 }, shown: { opacity: 1, scale: 1 } }}
					exit={{ opacity: 1, scale: 1, transition: { duration: 100 } }}
					transition={{ duration: 0 }}
				/>
			{/each}
		</motion.div>
	</motion.div>
{:else if scenario === 'custom' || scenario === 'orchestrate'}
	<motion.div
		data-expanded-item={id}
		custom={1}
		{variants}
		initial="hidden"
		animate="shown"
		exit={scenario === 'custom' ? 'leave' : 'orchestrated'}
		transition={{ duration: 0.18, ease: 'linear' }}
		onUpdate={(v) => report('parent-x', id, Number(v.x))}
		onAnimationComplete={(v) => report(String(v), id)}
	>
		<div>
			<motion.div
				data-expanded-inner={id}
				custom={3}
				{variants}
				transition={{ duration: 0.12, ease: 'linear' }}
				onUpdate={(v) => report('child-x', id, Number(v.x))}
				onAnimationComplete={(v) => report(`child-${String(v)}`, id)}
			/>
		</div>
	</motion.div>
{:else}
	<motion.div
		data-expanded-item={id}
		layout={scenario === 'layout'}
		layoutId={scenario === 'layout' ? 'presence-shared' : undefined}
		initial={scenario === 'reentry' && id === 'fast'
			? { opacity: 0.5 }
			: scenario === 'default'
				? { x: 0 }
				: 'hidden'}
		animate={scenario === 'controls' ? controls : scenario === 'default' ? { x: 100 } : 'enter'}
		exit={scenario === 'noexit' ? undefined : 'leave'}
		custom={scenario === 'reentry-custom' ? data.current : 1}
		{variants}
		transition={{
			duration: scenario.startsWith('reentry') && id === 'slow' ? 1.4 : 0.25,
			ease: 'linear'
		}}
		style={{
			width: 100,
			height: 40,
			...(scenario === 'reentry' && id === 'fast' ? { opacity } : {})
		}}
		onUpdate={(v) => {
			report('opacity', id, Number(v.opacity));
			report('x', id, Number(v.x));
		}}>{id}</motion.div
	>
{/if}
