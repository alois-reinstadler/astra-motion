import {
	buildHTMLStyles,
	calcGeneratorDuration,
	mix,
	spring,
	visualElementStore,
	type HTMLRenderState,
	type ResolvedValues
} from 'motion-dom';
import type { TransitionConfig } from 'svelte/transition';

/** Research only: one reversible native timeline feeds Motion's existing value/render pipeline. */
export function springPresenceSpike(node: HTMLElement): () => TransitionConfig {
	return () => {
		const visual = visualElementStore.get(node);
		if (!visual) throw new Error('The layout attachment must register before transition setup.');
		const generator = spring({ keyframes: [0, 1], stiffness: 420, damping: 38 });
		const duration = calcGeneratorDuration(generator);
		if (!Number.isFinite(duration)) throw new Error('Presence requires a finite spring.');
		return {
			duration,
			tick(t) {
				const progress = t === 0 || t === 1 ? t : generator.next(t * duration).value;
				visual.getValue('scale', 1).set(mix(0.8, 1, progress));
				visual.getValue('opacity', 1).set(progress);
				visual.render();
			}
		};
	};
}

/** Research only: Motion builds identical units/transform ordering without browser globals. */
export function initialStyleSpike(values: ResolvedValues) {
	const state: HTMLRenderState = { style: {}, vars: {}, transform: {}, transformOrigin: {} };
	buildHTMLStyles(state, values);
	return { ...state.style, ...state.vars };
}
