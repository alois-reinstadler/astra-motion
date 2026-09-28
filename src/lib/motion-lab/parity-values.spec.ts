import { expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { motionValue } from 'motion-dom';
import Harness from './parity-values-harness.svelte';

it('renders the complete helper graph with deterministic values and no browser globals', () => {
	expect(typeof document).toBe('undefined');
	const borrowed = motionValue(4);
	const changed = vi.fn();
	const destroy = vi.fn();
	borrowed.on('change', changed);
	const html = render(Harness, {
		props: {
			source: borrowed,
			onCreate(api) {
				api.owned.on('destroy', destroy);
				expect(api.derived.get()).toBe(12);
				expect(api.template.get()).toBe('translate(12px) 0');
				expect(api.scope.current).toBeUndefined();
				expect(() => api.animate(0, 1)).toThrow('mounts');
			}
		}
	}).body;
	expect(html).toContain('translate(12px) 0');
	expect(html).toContain('0/true/null/0');
	expect(destroy).toHaveBeenCalledOnce();
	borrowed.set(8);
	expect(changed).toHaveBeenCalledWith(8);
	borrowed.destroy();
});

it('does not retain any source subscriptions during server rendering', () => {
	const borrowed = motionValue(2);
	const subscribe = vi.spyOn(borrowed, 'on');
	render(Harness, { props: { source: borrowed } });
	expect(subscribe).not.toHaveBeenCalled();
	borrowed.destroy();
});
