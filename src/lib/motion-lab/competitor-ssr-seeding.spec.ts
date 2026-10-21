// Adapted scenarios: Humanspeak f2b5d76, src/lib/html/_MotionContainer.ssr.spec.ts.
// Uses real Svelte server rendering, rather than the reference's jsdom mounting.
// Provenance, adaptations and MIT notice: tests/competitor-baseline/README.md.
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import { motion, type MotionOptions } from '../motion/index.js';

function style(options: MotionOptions) {
	const { body } = render(motion.div, {
		props: { ...options, style: { borderRadius: '7px' } }
	});
	return body.match(/style="([^"]*)"/)?.[1] ?? '';
}

it.each([undefined, {}] as const)(
	'does not seed animate targets into SSR when initial is %j',
	(initial) => {
		expect(typeof document).toBe('undefined');
		const result = style({ initial, animate: { opacity: [0, 1], x: 100, '--progress': 1 } });
		expect(result).toContain('border-radius:7px');
		expect(result).not.toMatch(/(?:^|;)(?:opacity|transform|--progress):/);
	}
);

it('initial=false seeds the last animate keyframes, including zero and CSS variables', () => {
	const result = style({
		initial: false,
		animate: { opacity: [0.8, 0], x: [0, 40], '--progress': [0, 1] }
	});
	expect(result).toContain('opacity:0');
	expect(result).toContain('translateX(40px)');
	expect(result).toContain('--progress:1');
});

it('an explicit initial target wins over animate and uses its first keyframe', () => {
	const result = style({
		initial: { opacity: [0.3, 0.6], x: 10 },
		animate: { opacity: 1, x: 100 }
	});
	expect(result).toContain('opacity:0.3');
	expect(result).toContain('translateX(10px)');
	expect(result).not.toContain('translateX(100px)');
});
