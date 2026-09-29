<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { usePresence } from './presence-context.svelte.js';
	import { useAnimateMini } from './use-animate-mini.svelte.js';
	import { useTextPolicy } from './text-policy.svelte.js';
	import { segmentText } from './text-segments.js';
	import { textPreset, textSeconds } from './text-presets.js';
	import type { TextMotionOptions } from './text-types.js';
	let {
		text,
		options,
		visible = true,
		entrance = true,
		positioned = false
	}: {
		text: string;
		options: TextMotionOptions;
		visible?: boolean;
		entrance?: boolean;
		positioned?: boolean;
	} = $props();
	const presence = usePresence();
	const policy = useTextPolicy();
	const [scope, animate] = useAnimateMini();
	let mounted = $state(false);
	const groups = $derived(
		segmentText(text, mounted ? (options.split ?? 'whole') : 'whole', options.locale)
	);
	onMount(() => {
		mounted = true;
	});
	let initialized = false;
	function play() {
		const node = scope.current;
		const present = presence.isPresent;
		const remove = presence.safeToRemove;
		const active = policy.active();
		const reduced = policy.reduced;
		const show = visible;
		const settings = options;
		const allowEntrance = entrance;
		const ready = mounted;
		// Subscribe to segmentation so newly rendered fragments are animated too.
		void groups;
		const inheritedDuration = policy.config().transition?.duration;
		if (!node || !ready) return;
		const fragments = Array.from(node.querySelectorAll<HTMLElement>('[data-text-fragment]'));
		const preset = textPreset(settings);
		const duration = textSeconds(settings.duration, textSeconds(inheritedDuration, 0.3));
		const gap = textSeconds(settings.stagger, 0);
		let alive = true;
		const finish = () => {
			if (alive && !present) remove();
		};
		const target = present && show ? preset.visible : preset.hidden;
		if (!active || reduced || duration === 0 || (!initialized && (!allowEntrance || !show))) {
			for (const fragment of fragments)
				Object.assign(fragment.style, !active || reduced ? preset.visible : target);
			initialized = true;
			finish();
			return;
		}
		const start = !initialized && present && show ? preset.hidden : undefined;
		initialized = true;
		const controls = fragments.map((fragment, index) => {
			if (start) Object.assign(fragment.style, start);
			return untrack(() =>
				animate(fragment, target, {
					duration,
					delay: present && show ? gap * index : 0,
					ease: 'easeOut'
				})
			);
		});
		void Promise.all(controls.map((control) => control.finished)).then(finish);
		return () => {
			alive = false;
			// Native commitStyles throws on hidden/detached nodes in Firefox.
			// Sample while rendered, then cancel without asking WAAPI to commit.
			const poses = fragments.map((fragment) => {
				const computed = getComputedStyle(fragment);
				return {
					opacity: computed.opacity,
					transform: computed.transform,
					filter: computed.filter
				};
			});
			controls.forEach((control) => control.cancel());
			fragments.forEach((fragment, index) => Object.assign(fragment.style, poses[index]));
		};
	}
	$effect(play);
</script>

<span
	aria-hidden="true"
	data-text-layer
	style:position={positioned ? 'absolute' : undefined}
	style:inset={positioned ? '0' : undefined}
	style:display={positioned ? 'block' : 'inline'}
	{@attach scope.attach}
	>{#each groups as group, groupIndex (groupIndex)}{#if group.fragments.length}<span
				style:white-space={group.nowrap ? 'nowrap' : undefined}
				>{#each group.fragments as fragment, fragmentIndex (fragmentIndex)}<span
						data-text-fragment
						style:display="inline-block"
						style:max-width="100%">{fragment}</span
					>{/each}</span
			>{:else}{group.text}{/if}{/each}</span
>
