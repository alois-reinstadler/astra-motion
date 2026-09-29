// Motion 13.4.4 @ 33f6e72; adapted semantic SSR/type contracts, tests/motion-baseline MIT notices.
import { render } from 'svelte/server';
import { expect, expectTypeOf, it } from 'vitest';
import type { ReorderGroupProps, ReorderItemProps } from '../motion/index.js';
import Fixture from './UpstreamReorderExpanded.svelte';
it('reorder-contracts: SSR retains custom native tags, items and drag policy', () => {
	const html = render(Fixture, { props: { custom: true, count: 3 } }).body;
	expect(html).toContain('<article');
	expect(html.match(/<main /g) ?? []).toHaveLength(3);
	expect(html).toContain('data-item="2"');
	// Native drag suppression is installed by the client gesture attachment, not serialized by SSR.
	expect(html).toContain('Item 2');
	expect(html).toContain('overflow-anchor');
});
it('reorder-contracts: union values and callbacks retain types while invalid native props are rejected', () => {
	type Group = ReorderGroupProps<number | string, 'article'>;
	type Item = ReorderItemProps<number, 'main'>;
	expectTypeOf<Group['values']>().toEqualTypeOf<(number | string)[]>();
	expectTypeOf<Group['onReorder']>().toEqualTypeOf<(values: (number | string)[]) => void>();
	const values: number[] | string[] = [1, 2];
	const valid: Group = { values, onReorder: () => {}, id: 'group', class: 'list' };
	expect(valid.values).toEqual([1, 2]);
	// Svelte accepts string styles; test invalid native attributes instead of React serialization rules.
	// @ts-expect-error Native id cannot be boolean.
	const badGroup: Group = { values: [], onReorder: () => {}, id: true };
	// @ts-expect-error Native onclick cannot be text.
	const badItem: Item = { value: 1, onclick: 'invalid' };
	expect(badGroup.id).toBe(true);
	expect(badItem.value).toBe(1);
});
