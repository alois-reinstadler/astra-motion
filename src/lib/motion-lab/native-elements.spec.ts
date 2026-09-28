import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import { motion } from '../motion/index.js';
import NativeElements from './NativeElements.svelte';

it('renders compiled native elements with bindings and semantic attributes during SSR', () => {
	const { body } = render(NativeElements);
	expect(body).toMatch(/<input[^>]*aria-label="Text"[^>]*value="hello"/);
	expect(body).toMatch(/<input[^>]*type="number"[^>]*value="12"/);
	expect(body).toMatch(/<input[^>]*type="checkbox"[^>]*checked/);
	expect(body).toMatch(/<textarea[^>]*>notes<\/textarea>/);
	expect(body).toMatch(/<button[^>]*style="[^"]*color:red;[^"]*opacity:0.2/);
	expect(body.replace(/<!--.*?-->/g, '')).toContain('>Action</button>');
	expect(body).not.toMatch(/<div\b/);
});

it('exports compiled tag components and an explicit custom component factory', () => {
	expect(motion.button).toBeTypeOf('function');
	expect(motion.input).toBeTypeOf('function');
	expect(motion.var).toBeTypeOf('function');
	expect(motion.svg).toBeTypeOf('function');
	expect(motion.create).toBeTypeOf('function');
});
