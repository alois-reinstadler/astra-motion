import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import MotionComponent from './MotionComponent.svelte';

it('renders semantic elements with merged initial styles and no wrapper during SSR', () => {
	const { body } = render(MotionComponent);
	expect(body).toMatch(/<button[^>]*style="[^"]*color:red;[^"]*opacity:0.2/);
	expect(body.match(/<li\b/g)).toHaveLength(3);
	expect(body).toMatch(/<input[^>]*value="native"/);
	expect(body).not.toMatch(/<div\b/);
});
