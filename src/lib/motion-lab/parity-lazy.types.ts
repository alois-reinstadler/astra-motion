import type { ComponentProps } from 'svelte';
import type LazyMotion from '../motion/LazyMotion.svelte';
import * as m from '../motion/m/index.js';
import { domAnimation } from '../motion/dom-animation.js';
import { domMax } from '../motion/dom-max.js';
import type { FeatureBundle, LazyFeatureBundle } from '../motion/lazy-context.js';

type LazyProps = ComponentProps<typeof LazyMotion>;
// Compile-only checks also establish that static native tags retain precise public props.
export function checkLazyInference() {
	const basic: FeatureBundle = domAnimation;
	const full: FeatureBundle = domMax;
	const deferred: LazyFeatureBundle = async () => full;
	const syncProps: LazyProps = { features: basic };
	const asyncProps: LazyProps = { features: deferred, strict: true };
	// @ts-expect-error A feature source is required.
	const missing: LazyProps = {};
	// @ts-expect-error Return the bundle, rather than the imported namespace.
	const namespace: LazyProps = { features: () => import('../motion/dom-animation.js') };
	const input: ComponentProps<typeof m.input> = {
		value: 'retained',
		ref: document.createElement('input')
	};
	const circle: ComponentProps<typeof m.circle> = {
		cx: 10,
		initial: { pathLength: 0 },
		animate: { r: 20 }
	};
	const deprecatedParam: ComponentProps<typeof m.param> = { name: 'movie', value: 'example' };
	// @ts-expect-error A circle ref does not accept an HTML input element.
	const wrongRef: ComponentProps<typeof m.circle> = { ref: document.createElement('input') };
	return { syncProps, asyncProps, missing, namespace, input, circle, deprecatedParam, wrongRef };
}
