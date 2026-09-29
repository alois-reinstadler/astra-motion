// Motion v13.4.4, commit 33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343.
// Sources and MIT attribution: tests/motion-baseline/README.md and LICENSE.motion.
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import Fixture from './UpstreamSvgExpanded.svelte';
it('svg-ssr-transforms: serializes drawing/geometry values and preserves an authored transform box', () => {
	const { body } = render(Fixture, { props: { mode: 'ssr' } });
	const circle = body.match(/<circle[^>]*>/)![0];
	const path = body.match(/<path[^>]*>/)![0];
	for (const expected of [
		'cx="50"',
		'stroke-width="10"',
		'pathLength="1"',
		'stroke-dasharray="0.5 1"',
		'translateX(100px)',
		'transform-origin:50% 50%',
		'transform-box:fill-box'
	])
		expect(circle).toContain(expected);
	expect(path).toContain('transform-box:view-box');
	expect(path).toContain('transform-origin:50% 50%');
	expect(path).toContain('transform:none');
	expect(body).not.toContain('[object Object]');
});
