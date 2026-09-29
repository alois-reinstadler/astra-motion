import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import AnimatePresence, { type AnimatePresenceProps } from '../motion/AnimatePresence.svelte';
import { reconcilePresence } from '../motion/presence-model.js';

const children = createRawSnippet<[unknown]>((value) => ({
	render: () => `<span>${String(value())}</span>`
}));

it.each([null, undefined])('renders no single-value child for %s during SSR', (value) => {
	const result = render(AnimatePresence, { props: { value, children } });
	expect(result.body).not.toContain('<span>');
});
it.each([false, 0, ''])('keeps non-null falsy values present during SSR (%s)', (value) => {
	const result = render(AnimatePresence, { props: { value, children } });
	expect(result.body).toContain(`<span>${String(value)}</span>`);
});
it.each([
	{ value: undefined, present: false },
	{ value: 'a', items: ['a'], key: (value: string) => value },
	{ present: false, items: [], key: (value: string) => value },
	{ key: (value: string) => value }
])('rejects conflicting or meaningless presence forms at runtime', (props) => {
	expect(() => render(AnimatePresence, { props: { ...props, children } as never }).body).toThrow(
		/mutually exclusive|key requires/
	);
});
it('uses reference identity, including reversal, without losing outgoing data', () => {
	const original = { id: 'a', text: 'old' };
	const replacement = { id: 'a', text: 'new' };
	const first = reconcilePresence([], [{ key: original, value: original }], 'sync');
	const next = reconcilePresence(first, [{ key: replacement, value: replacement }], 'sync');
	expect(next).toHaveLength(2);
	expect(next[0].value).toBe(original);
	expect(next[0].isPresent).toBe(false);
	const reversed = reconcilePresence(next, [{ key: original, value: original }], 'sync');
	expect(reversed.find((entry) => entry.isPresent)?.token).toBe(first[0].token);
});
it('exposes mutually exclusive presence props to TypeScript', () => {
	const valid: AnimatePresenceProps<string> = { value: undefined, children };
	// @ts-expect-error Single-value and boolean presence cannot be combined.
	const invalid: AnimatePresenceProps<string> = { value: 'a', present: true, children };
	// @ts-expect-error Single-value and collection presence cannot be combined.
	const invalidList: AnimatePresenceProps<string> = {
		value: 'a',
		items: ['a'],
		key: (value) => value,
		children
	};
	expect(valid.value).toBeUndefined();
	expect(invalid.present).toBe(true);
	expect(invalidList.items).toEqual(['a']);
});
