import { describe, expect, it } from 'vitest';
import { compile, parse, print } from 'svelte/compiler';
import { transformLayoutAttributes } from './compiler.js';

describe('optional compiler ergonomics spike', () => {
	const fixtures = [
		'<div layout></div>',
		'<script>let id = "card";</script><div layoutId={id}></div>',
		'<script lang="ts">let id: string = "card";</script><div layout layoutId={id}></div>',
		'<script module>export const version = 1;</script><div layout></div>',
		'<script module lang="ts">export const version: number = 1;</script><script lang="ts">let id: string = "a";</script><div layoutId={id}></div>',
		'<script>import { tick } from "svelte"; const __astraLayout = 1; const __astraCreateLayout = 2;</script><div layout></div>',
		'<script>const first = () => {}; const second = () => {};</script><div {@attach first} layout {@attach second}></div>',
		'<script>let id = "a";</script>{#snippet card(value)}<div layoutId={value}></div>{/snippet}{@render card(id)}',
		'<script>let items = [1, 2];</script>{#each items as item (item)}<div layout="position" layoutId={`item-${item}`}>{item}</div>{/each}',
		'<div layoutId="a&amp;b"></div><pre>  exact\n whitespace  </pre>',
		'<script>// a retained comment\nlet x = "</scr" + "ipt>";</script><!-- layout --> <div layout></div><style>div { color: red }</style>'
	];

	it.each(fixtures)('preserves syntax through client, SSR and HMR compilation: %s', (source) => {
		const result = transformLayoutAttributes(source, 'Fixture.svelte');
		expect(result.transformed).toBeGreaterThan(0);
		for (const options of [
			{ generate: 'client' as const },
			{ generate: 'server' as const },
			{ generate: 'client' as const, hmr: true, dev: true }
		]) {
			expect(() =>
				compile(result.code, { filename: 'Fixture.svelte', runes: true, ...options })
			).not.toThrow();
		}
		expect(result.map.sources).toEqual(['Fixture.svelte']);
		expect(result.map.sourcesContent).toEqual([source]);
		expect(result.map.mappings.length).toBeGreaterThan(0);
		expect(transformLayoutAttributes(source).code).toBe(transformLayoutAttributes(source).code);
	});

	it('keeps untouched source bytes and is idempotent', () => {
		const source =
			'<script>const x = 1; // keep me\n</script><div layout>hello <b>world</b> !</div><pre>  a\n b </pre>';
		const result = transformLayoutAttributes(source);
		expect(result.code).toContain('const x = 1; // keep me\n');
		expect(result.code).toContain('>hello <b>world</b> !</div><pre>  a\n b </pre>');
		expect(transformLayoutAttributes(result.code).code).toBe(result.code);
	});

	it('avoids collisions even in snippet and module scopes', () => {
		const source =
			'<script module>const __astraCreateLayout = 1;</script>{#snippet child(__astraLayout)}<div layout>{__astraLayout}</div>{/snippet}';
		const result = transformLayoutAttributes(source);
		expect(result.controller).toBe('__astraLayout_');
		expect(result.code).toContain('createLayout as __astraCreateLayout_');
	});

	it('does not change ordinary components or transition directives', () => {
		const source =
			'<script>import Card from "./Card.svelte"; import { fade } from "svelte/transition";</script><Card/><div transition:fade>text</div>';
		expect(transformLayoutAttributes(source).code).toBe(source);
	});

	it.each([
		['<Card layout />', 'native HTML'],
		['<svg><rect layout /></svg>', 'native HTML'],
		['<svelte:element this="div" layout />', 'native HTML'],
		['<div layout {...props}></div>', 'spread'],
		['<div layout transition:fade></div>', 'coordination'],
		['<div layout in:fade out:fade></div>', 'coordination'],
		['{#each items as item (item)}<div layout animate:flip></div>{/each}', 'coordination'],
		['<div layout={enabled}></div>', 'reactive options'],
		['<div layoutId></div>', 'requires'],
		['<div layoutId="item-{id}"></div>', 'mixed quoted']
	])('rejects unsupported input precisely: %s', (source, message) => {
		expect(() => transformLayoutAttributes(source, 'Invalid.svelte')).toThrow(message);
	});

	it('never rewrites mutation boundaries or invents full layout semantics', () => {
		const source =
			'<script>let open = $state(false);</script><button onclick={() => open = !open}>Toggle</button><div layout>{open}</div>';
		const result = transformLayoutAttributes(source);
		expect(result.code).toContain('onclick={() => open = !open}');
		expect(result.code).not.toContain('.update(');
	});

	it('proves the installed modern AST printer, including TS and source maps', () => {
		const result = print(
			parse('<script lang="ts">let x: number = 1;</script><div>{x}</div>', { modern: true })
		);
		expect(result.code).toContain('x: number');
		expect(() => compile(result.code, { generate: 'server' })).not.toThrow();
		expect(result.map).toHaveProperty('mappings');
	});
});
