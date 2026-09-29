import { onDestroy, untrack } from 'svelte';
import { createAttachmentKey, type Attachment } from 'svelte/attachments';
import type { ResolvedValues, VariantLabels } from 'motion-dom';
import { captureMotionEnvironment, provideMotionTree } from './component-context.js';
import { initialMotionProps, resolveInitialMotionValues } from './initial-render.js';
import { readLazyMotion, type FeatureBundle } from './lazy-context.js';
import { shouldReduceMotion } from './policy.js';
import type { MotionBinding, MotionFeatures, MotionOptions } from './motion-core.svelte.js';
import type {
	MotionElement,
	MotionInput,
	MotionRenderOptions,
	MotionTree,
	VariantSource
} from './motion-types.js';
import type { PresenceTimeline } from './presence-state.js';

const isLabel = (value: unknown): value is VariantLabels =>
	typeof value === 'string' || Array.isArray(value);

const noTransition = (): PresenceTimeline => ({
	duration: 0,
	progress: 1,
	span: 0,
	schedule() {},
	finish() {},
	reduceMotion() {},
	cancel() {}
});

/** A native binding that preserves its element while its runtime loads. */
export function createLazyComponentMotion(
	input: MotionInput = {},
	render: MotionRenderOptions = {}
): MotionBinding {
	const lazy = readLazyMotion();
	const environment = render.environment ?? captureMotionEnvironment();
	render = { ...render, environment, lazy: true };
	const options = (): MotionOptions => ({
		reducedMotion: 'never',
		layoutGroup: environment.layout?.controller,
		...environment.config(),
		...(typeof input === 'function' ? input() : input)
	});
	const source = (): VariantSource => {
		const config = options();
		const parent = config.inherit === false ? {} : (environment.parent?.source() ?? {});
		return {
			initial:
				config.initial === false || isLabel(config.initial) ? config.initial : parent.initial,
			animate: isLabel(config.animate) ? config.animate : parent.animate,
			exit: isLabel(config.exit) ? config.exit : parent.exit
		};
	};
	const initialOptions = () => {
		const config = options(),
			inherited = source();
		return {
			...config,
			initial:
				environment.presence?.snapshot.initial === false
					? false
					: (config.initial ?? inherited.initial),
			animate: config.animate ?? inherited.animate
		};
	};
	const initial: ResolvedValues = untrack(
		() => render.initialValues ?? resolveInitialMotionValues(initialOptions(), render)
	);
	let element = $state.raw<MotionElement>();
	let binding = $state.raw<MotionBinding>();
	let selected = $state.raw<FeatureBundle | undefined>(untrack(() => lazy?.bundle));
	let detach: (() => void) | undefined;
	let disposeRuntime: (() => void) | undefined;
	const available = () => lazy?.bundle ?? selected;
	const features: MotionFeatures = {
		get layout() {
			return available()?.features.layout;
		},
		get gestures() {
			return available()?.features.gestures;
		},
		get drag() {
			return available()?.features.drag;
		}
	};
	const tree: MotionTree = { source, element: () => element };
	provideMotionTree(tree);
	const create = (bundle: FeatureBundle) => {
		const latest = initialOptions();
		// A deferred initial=false element must adopt its latest target without
		// an entrance. Its server pose can be older than the installed runtime.
		const values = latest.initial === false ? resolveInitialMotionValues(latest, render) : initial;
		return bundle.create(input, { ...render, initialValues: values }, features);
	};
	// A synchronous bundle follows the same setup/SSR path as eager components.
	const first = untrack(() => selected);
	if (first) binding = untrack(() => create(first));
	function loadRuntime() {
		const next = lazy?.bundle;
		if (!next || !environment.activity()) return;
		selected = next;
		if (untrack(() => binding)) return;
		untrack(() => {
			disposeRuntime = $effect.root(() => {
				const runtime = create(next);
				binding = runtime;
				if (element) detach = runtime.attach(element) || undefined;
			});
		});
	}
	$effect(loadRuntime);
	onDestroy(() => {
		detach?.();
		detach = undefined;
		disposeRuntime?.();
	});
	const attach: Attachment<MotionElement> = (node) =>
		untrack(() => {
			if (element) throw new Error('Astra m: create a separate binding for each native element.');
			element = node;
			if (binding) detach = binding.attach(node) || undefined;
			return () => {
				detach?.();
				detach = undefined;
				element = undefined;
			};
		});
	const attachment = createAttachmentKey();
	const proxy: MotionBinding = {
		tree,
		attach,
		get props() {
			const props = binding?.props ?? initialMotionProps(options(), render, initial);
			return {
				...Object.fromEntries(Object.entries(props)),
				style: props.style,
				[attachment]: attach
			};
		},
		get reducedMotion() {
			return binding?.reducedMotion ?? shouldReduceMotion(options());
		},
		transition(node) {
			return (settings) => (binding ? binding.transition(node)(settings) : noTransition());
		},
		animate(target, transition) {
			return (
				binding?.animate(target, transition) ??
				Promise.reject(new Error('Astra m: animation features have not loaded.'))
			);
		},
		stop() {
			binding?.stop();
		},
		update(change) {
			const runtime = binding;
			if (!runtime) throw new Error('Astra m: layout features have not loaded.');
			return runtime.update(change);
		},
		child(childInput = {}, childRender = {}) {
			return createLazyComponentMotion(childInput, {
				...childRender,
				environment: { ...environment, parent: tree }
			});
		}
	};
	return proxy;
}
