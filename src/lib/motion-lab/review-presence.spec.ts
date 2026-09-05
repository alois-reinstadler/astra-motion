import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ReviewPresence from './ReviewPresence.svelte';
import ReviewEmptyPresence from './ReviewEmptyPresence.svelte';
import Lab from '../../routes/motion-lab/+page.svelte';

describe('presence server rendering', () => {
	it('renders deterministic initial content without browser globals', async () => {
		const first = render(ReviewPresence);
		const second = render(ReviewPresence);
		await Promise.resolve();
		expect(first.body).toBe(second.body);
		expect(first.body).toContain('data-value="a"');
	});

	it('renders an empty initial snippet without scheduling new server content', async () => {
		const result = render(ReviewEmptyPresence);
		await Promise.resolve();
		expect(result.body).not.toContain('data-review');
	});

	it('renders the complete laboratory with deterministic default content on the server', () => {
		const result = render(Lab);
		expect(result.body).toContain('data-testid="presence"');
		expect(result.body).toContain('data-testid="wait-item"');
		expect(result.body.match(/data-testid="tile-\d+"/g)).toHaveLength(10);
		expect(result.head).toContain('Astra / Motion laboratory');
	});
});
