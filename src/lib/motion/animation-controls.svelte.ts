import { onMount, untrack } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import {
	setTarget,
	type AnimationDefinition,
	type LegacyAnimationControls,
	type Transition,
	type VisualElement
} from 'motion-dom';
import {
	animateMotionDefinition,
	cancelMotionSequence,
	isMotionAnimationActive
} from './animation.js';
import { readActivityState } from './activity-scope.js';

type StartVisual = (
	visual: VisualElement,
	definition: AnimationDefinition,
	transition?: Transition
) => Promise<void>;
function createControls(startVisual: StartVisual): LegacyAnimationControls {
	let mounted = false;
	let ready = false;
	let mountGeneration = 0;
	let commandEpoch = 0;
	const subscribers = new SvelteSet<VisualElement>();
	const requireMounted = () => {
		if (!mounted)
			throw new Error(
				'Astra animation controls: start() and set() require a mounted component. Call them in onMount or an effect.'
			);
	};
	function setValues(visual: VisualElement, definition: AnimationDefinition) {
		if (typeof definition === 'string' || Array.isArray(definition)) {
			// Controls.set follows upstream's legacy first-label-wins precedence.
			const labels = typeof definition === 'string' ? [definition] : definition;
			for (const label of [...labels].reverse()) {
				const target = visual.getVariant(label);
				if (target) setTarget(visual, target);
				visual.variantChildren?.forEach((child) => setValues(child, labels));
			}
		} else setTarget(visual, definition);
	}
	const controls: LegacyAnimationControls = {
		subscribe(visual: VisualElement) {
			subscribers.add(visual);
			return () => {
				subscribers.delete(visual);
			};
		},
		start(definition: AnimationDefinition, transitionOverride?: Transition) {
			requireMounted();
			const epoch = commandEpoch;
			// Attachments finish materializing ancestry in this microtask. A parent's
			// onMount can therefore start all children without asking authors to tick().
			const run = () =>
				mounted && epoch === commandEpoch
					? Promise.all(
							[...subscribers].map((visual) => startVisual(visual, definition, transitionOverride))
						)
					: Promise.resolve([]);
			return ready ? run() : Promise.resolve().then(run);
		},
		set(definition) {
			requireMounted();
			commandEpoch++;
			const apply = () => {
				if (mounted) subscribers.forEach((visual) => setValues(visual, definition));
			};
			if (ready) apply();
			else queueMicrotask(apply);
		},
		stop() {
			commandEpoch++;
			subscribers.forEach((visual) => {
				cancelMotionSequence(visual);
				visual.values.forEach((value) => value.stop());
			});
		},
		mount() {
			mounted = true;
			const generation = ++mountGeneration;
			queueMicrotask(() => {
				if (mounted && generation === mountGeneration) ready = true;
			});
			return () => {
				mounted = false;
				ready = false;
				controls.stop();
			};
		}
	};
	return controls;
}

/** Imperative variant controls share the same visual owners as declarative motion props. */
export function animationControls(): LegacyAnimationControls {
	return createControls((visual, definition, transitionOverride) =>
		animateMotionDefinition(visual, definition, { transitionOverride })
	);
}

/** Create controls once during component setup; Svelte owns their mount and cleanup. */
export function useAnimationControls(): LegacyAnimationControls {
	const active = readActivityState();
	type PendingRun = { start(): void; cancel(): void };
	const pending = new SvelteMap<VisualElement, PendingRun[]>();
	const controls = createControls((visual, definition, transitionOverride) => {
		const start = () => animateMotionDefinition(visual, definition, { transitionOverride });
		if (untrack(() => active() && isMotionAnimationActive(visual))) return start();
		// Even duration:0 schedules an uncancellable engine frame. Do not create
		// hidden playback until reveal; it must not mutate retained values first.
		return new Promise<void>((resolve, reject) => {
			const jobs = pending.get(visual) ?? [];
			jobs.push({
				start: () => {
					void start().then(resolve, reject);
				},
				cancel: resolve
			});
			pending.set(visual, jobs);
		});
	});
	function cancelPending(visual?: VisualElement) {
		for (const [owner, jobs] of pending) {
			if (visual && visual !== owner) continue;
			pending.delete(owner);
			for (const job of jobs) job.cancel();
		}
	}
	const stop = controls.stop;
	controls.stop = () => {
		cancelPending();
		stop();
	};
	const set = controls.set;
	controls.set = (definition) => {
		cancelPending();
		set(definition);
	};
	const paused = new SvelteMap<
		VisualElement,
		SvelteMap<object, { resume(): void; paused(): boolean }>
	>();
	const originalSubscribe = controls.subscribe;
	const visuals = new SvelteSet<VisualElement>();
	controls.subscribe = (visual: VisualElement) => {
		visuals.add(visual);
		const unsubscribe = originalSubscribe(visual);
		return () => {
			cancelPending(visual);
			visuals.delete(visual);
			paused.delete(visual);
			unsubscribe();
		};
	};
	function updateActivity() {
		const ownerActive = active();
		for (const visual of visuals) {
			const visible = ownerActive && isMotionAnimationActive(visual);
			untrack(() => {
				if (visible) {
					for (const animation of paused.get(visual)?.values() ?? [])
						if (animation.paused()) animation.resume();
					paused.delete(visual);
					const jobs = pending.get(visual);
					pending.delete(visual);
					for (const job of jobs ?? []) job.start();
					return;
				}
				let held = paused.get(visual);
				if (!held) paused.set(visual, (held = new SvelteMap()));
				visual.values.forEach((value) => {
					const animation = value.animation;
					if (
						animation?.state === 'running' &&
						'pause' in animation &&
						typeof animation.pause === 'function' &&
						'play' in animation &&
						typeof animation.play === 'function'
					) {
						animation.pause();
						const play = animation.play.bind(animation);
						held.set(animation, { paused: () => animation.state === 'paused', resume: play });
					}
				});
			});
		}
	}
	const start = controls.start;
	controls.start = (definition, transition) => {
		const completion = start(definition, transition);
		queueMicrotask(updateActivity);
		return completion;
	};
	onMount(() => controls.mount());
	$effect(updateActivity);
	return controls;
}

export const useAnimation = useAnimationControls;
