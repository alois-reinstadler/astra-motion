import { expect, it, vi } from 'vitest';
import type { OnNavigate } from '@sveltejs/kit';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
const lifecycle = vi.hoisted(() => ({
	navigate: undefined as ((navigation: OnNavigate) => unknown) | undefined
}));
vi.mock('$app/navigation', () => ({
	onNavigate: (callback: (navigation: OnNavigate) => unknown) => {
		lifecycle.navigate = callback;
	}
}));
import RoutePresenceReview from './RoutePresenceReview.svelte';

async function review(
	props: { nested?: boolean; sibling?: boolean; duplicate?: boolean; authoredInert?: boolean },
	run: (
		screen: ReturnType<typeof render<typeof RoutePresenceReview>>,
		navigate: (value?: boolean) => Promise<ViewTransition>
	) => Promise<void>
) {
	const start = document.startViewTransition.bind(document);
	let transition: ViewTransition | undefined;
	const spy = vi.spyOn(document, 'startViewTransition').mockImplementation((update) => {
		transition = start(update);
		return transition;
	});
	const screen = render(RoutePresenceReview, props);
	try {
		await tick();
		await run(screen, async (value = true) => {
			let committed = () => {};
			const complete = new Promise<void>((resolve) => {
				committed = resolve;
			});
			await lifecycle.navigate!({ complete } as OnNavigate);
			screen.component.navigate(value);
			await tick();
			committed();
			await transition!.ready;
			return transition!;
		});
	} finally {
		transition?.skipTransition();
		await screen.unmount();
		spy.mockRestore();
	}
}

it.each([false, true])(
	'pairs retained sources, preserves persistent identities, and reverses out-only transitions (ancestor outro: %s)',
	async (nested) => {
		await review({ nested }, async (screen, navigate) => {
			const source = document.querySelector<HTMLElement>('[data-route-source]')!;
			const persistent = document.querySelector<HTMLElement>('[data-route-persistent]')!;
			for (let index = 0; index < 3; index++) {
				await navigate();
				const destination = document.querySelector<HTMLElement>('[data-route-destination]')!;
				expect(source.isConnected).toBe(true);
				expect(destination.isConnected).toBe(true);
				expect(screen.component.issues()).toEqual([]);
				expect(source.style.viewTransitionName).toBe('');
				expect(destination.style.viewTransitionName).toMatch(/^astra_/);
				expect(persistent.style.viewTransitionName).toMatch(/^astra_/);
				await navigate(false);
				expect(document.querySelector('[data-route-source]')).toBe(source);
				expect(source.style.viewTransitionName).toMatch(/^astra_/);
				expect(screen.component.issues()).toEqual([]);
			}
		});
	}
);

it('still diagnoses two live incoming destinations', async () => {
	await review({ duplicate: true }, async (screen, navigate) => {
		await navigate();
		expect(screen.component.issues()).toEqual([
			'Duplicate routeShared ID in one scope; this pair was skipped.'
		]);
		expect(
			document.querySelector<HTMLElement>('[data-route-destination]')!.style.viewTransitionName
		).toBe('');
	});
});

it('pairs an outgoing source that was already authored inert', async () => {
	await review({ authoredInert: true }, async (screen, navigate) => {
		await navigate();
		expect(screen.component.issues()).toEqual([]);
	});
});

it('restores names and removes document lifecycle listeners on disposal', async () => {
	const added = vi.spyOn(document, 'addEventListener');
	const removed = vi.spyOn(document, 'removeEventListener');
	const nodes: HTMLElement[] = [];
	try {
		await review({}, async (_screen, navigate) => {
			await navigate();
			nodes.push(
				...document.querySelectorAll<HTMLElement>(
					'[data-route-source], [data-route-destination], [data-route-persistent]'
				)
			);
		});
		for (const node of nodes) expect(node.style.viewTransitionName).toBe('');
		for (const [name, callback, capture] of added.mock.calls) {
			if (name === 'introstart' || name === 'outrostart')
				expect(removed).toHaveBeenCalledWith(name, callback, capture);
		}
	} finally {
		added.mockRestore();
		removed.mockRestore();
	}
});

it('pairs a plain source retained only by an unrelated outgoing sibling, then reverses it', async () => {
	await review({ sibling: true }, async (screen, navigate) => {
		const source = document.querySelector<HTMLElement>('[data-route-source]')!;
		await navigate();
		const destination = document.querySelector<HTMLElement>('[data-route-destination]')!;
		expect(source.isConnected).toBe(true);
		expect(source.closest('[inert]')).toBeNull();
		expect(source.style.viewTransitionName).toBe('');
		expect(destination.style.viewTransitionName).toMatch(/^astra_/);
		expect(screen.component.issues()).toEqual([]);
		await navigate(false);
		expect(document.querySelector('[data-route-source]')).toBe(source);
		expect(source.style.viewTransitionName).toMatch(/^astra_/);
		expect(screen.component.issues()).toEqual([]);
	});
});
