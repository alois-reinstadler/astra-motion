// Motion v13.4.4, commit 33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343.
// Sources and MIT attribution: tests/motion-baseline/README.md and LICENSE.motion.
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import Fixture from './UpstreamComponentsExpanded.svelte';
function tag(body: string, name: string) {
	const match = body.match(new RegExp(`<[^>]+data-case="${name}"[^>]*>`));
	expect(match).not.toBeNull();
	return match![0];
}

it('ssr-initial-value-composition: combines borrowed values and initial targets with endpoint precedence', () => {
	const { body } = render(Fixture, { props: { mode: 'ssr' } });
	for (const name of ['html', 'custom']) {
		expect(tag(body, name)).toContain('translateX(100px) translateY(200px)');
		expect(tag(body, name)).not.toContain('[object Object]');
	}
	expect(tag(body, 'custom')).toMatch(/^<upstream-test\b/);
	expect(tag(body, 'endpoint')).toContain('translateX(100px)');
	expect(tag(body, 'endpoint')).not.toContain('200px');
});

it.each([false, true])(
	'ssr-tap-focusability: preserves explicit tabindex; automatic tabindex is client-owned (explicit=%s)',
	(explicitTabindex) => {
		const { body } = render(Fixture, { props: { mode: 'tap', explicitTabindex } });
		for (const name of ['tap', 'tap-start', 'while-tap']) {
			if (explicitTabindex) expect(tag(body, name)).toContain('tabindex="2"');
			else expect(tag(body, name)).not.toContain('tabindex');
		}
	}
);

it('ssr-reorder-elements: serializes default/custom tags without disabling separate-handle touch scrolling', () => {
	const { body } = render(Fixture, { props: { mode: 'reorder' } });
	expect(tag(body, 'default-group')).toMatch(/^<ul\b/);
	expect(tag(body, 'default-item')).toMatch(/^<li\b/);
	expect(tag(body, 'custom-group')).toMatch(/^<div\b/);
	expect(tag(body, 'custom-item')).toMatch(/^<div\b/);
	expect(tag(body, 'custom-item')).not.toMatch(/touch-action|user-select|touch-callout/);
});

it('ssr-will-change: keeps authored hints and never synthesizes hints for animated or borrowed values', () => {
	const { body } = render(Fixture, { props: { mode: 'will-change' } });
	for (const name of ['automatic', 'borrowed', 'empty'])
		expect(tag(body, name)).not.toContain('will-change');
	for (const name of ['string', 'string-static', 'value', 'value-static'])
		expect(tag(body, name)).toContain('will-change:opacity');
	expect(tag(body, 'borrowed')).toContain('opacity:0.5');
	expect(tag(body, 'automatic')).toContain('translateX(100px)');
});
