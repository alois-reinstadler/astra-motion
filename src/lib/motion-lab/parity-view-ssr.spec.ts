import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import Fixture from './ParityView.svelte';

it('renders a wrapperless view boundary on the server without touching browser APIs', () => {
	const onStart = vi.fn();
	const onComplete = vi.fn();
	const result = render(Fixture, { props: { onStart, onComplete } });
	expect(result.body).toContain('data-native-view="a"');
	expect(result.body).toContain('view-transition-name: authored-card !important');
	expect(result.body.match(/<div/g)).toHaveLength(1);
	expect(onStart).not.toHaveBeenCalled();
	expect(onComplete).not.toHaveBeenCalled();
});
