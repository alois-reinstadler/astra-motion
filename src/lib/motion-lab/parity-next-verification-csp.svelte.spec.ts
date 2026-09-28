import { expect, it } from 'vitest';
import { popPresenceNodes } from '../motion/presence-pop.js';
import { startViewTransition } from '../motion/view-transitions.js';

const nonce = 'astra-focused-csp-authorization';

async function enforcedDocument() {
	const iframe = document.createElement('iframe');
	iframe.width = '400';
	iframe.height = '240';
	const loaded = new Promise<void>((resolve) =>
		iframe.addEventListener('load', () => resolve(), { once: true })
	);
	iframe.srcdoc = `<!doctype html><html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'">
<style nonce="${nonce}">body{margin:0}#root{height:80px;width:140px;background:rgb(10,20,30)}#sibling{height:20px}</style>
</head><body><div id="root">Retained root</div><div id="sibling">Sibling</div></body></html>`;
	document.body.append(iframe);
	await loaded;
	const target = iframe.contentDocument!;
	const violations: string[] = [];
	target.addEventListener('securitypolicyviolation', (event) =>
		violations.push(event.effectiveDirective)
	);
	const forbidden = target.createElement('style');
	forbidden.textContent = '#root{background:rgb(200,0,0)!important}';
	target.head.append(forbidden);
	await expect
		.poll(() => violations.some((directive) => directive.startsWith('style-src')))
		.toBe(true);
	expect(target.defaultView!.getComputedStyle(target.querySelector('#root')!).backgroundColor).toBe(
		'rgb(10, 20, 30)'
	);
	expect(forbidden.sheet).toBeNull();
	return { iframe, target, violations };
}

it('authorizes the actual pop stylesheet in an enforced CSP document and restores geometry on cleanup', async () => {
	const { iframe, target, violations } = await enforcedDocument();
	let restore = () => {};
	try {
		const root = target.querySelector<HTMLElement>('#root')!;
		const sibling = target.querySelector<HTMLElement>('#sibling')!;
		const before = root.getBoundingClientRect();
		const siblingTop = sibling.getBoundingClientRect().top;
		const previousViolations = violations.length;
		restore = popPresenceNodes(new Set([root]), { nonce });
		await expect.poll(() => target.defaultView!.getComputedStyle(root).position).toBe('absolute');
		expect(root.getBoundingClientRect().top).toBeCloseTo(before.top, 1);
		expect(root.getBoundingClientRect().width).toBeCloseTo(before.width, 1);
		expect(sibling.getBoundingClientRect().top).toBeCloseTo(siblingTop - before.height, 1);
		const injected = [...target.querySelectorAll('style')].find((style) =>
			style.textContent?.includes('data-astra-presence-pop')
		)!;
		expect(injected.sheet?.cssRules.length).toBe(1);
		expect(violations).toHaveLength(previousViolations);
		restore();
		expect(injected.isConnected).toBe(false);
		expect(root.hasAttribute('data-astra-presence-pop')).toBe(false);
		expect(target.defaultView!.getComputedStyle(root).position).toBe('static');
		expect(sibling.getBoundingClientRect().top).toBeCloseTo(siblingTop, 1);
	} finally {
		restore();
		iframe.remove();
	}
});

it('authorizes native View reset rules under enforced CSP and releases them without losing the update', async () => {
	expect(typeof document.startViewTransition).toBe('function');
	const { iframe, target, violations } = await enforcedDocument();
	let release!: () => void;
	const gate = new Promise<void>((resolve) => (release = resolve));
	let updates = 0;
	const previousViolations = violations.length;
	const handle = startViewTransition(
		async () => {
			updates++;
			await gate;
			target.querySelector('#root')!.textContent = 'Updated under CSP';
		},
		{ document: target, nonce, reducedMotion: 'never' }
	);
	try {
		await expect.poll(() => updates).toBe(1);
		expect(typeof target.startViewTransition).toBe('function');
		const reset = target.querySelector<HTMLStyleElement>('[data-astra-view-reset]')!;
		expect(reset).not.toBeNull();
		expect(reset.sheet?.cssRules.length).toBe(2);
		const rootRule = reset.sheet!.cssRules[1] as CSSStyleRule;
		expect(rootRule.style.getPropertyValue('animation-name')).toBe('none');
		expect(rootRule.style.getPropertyPriority('animation-name')).toBe('important');
		expect(rootRule.selectorText).toContain('::view-transition-old(root)');
		expect(rootRule.selectorText).toContain('::view-transition-new(root)');
		expect(violations).toHaveLength(previousViolations);
		release();
		await handle.updateCallbackDone;
		await expect(handle.finished).resolves.toBe('finished');
		expect(target.querySelector('#root')!.textContent).toBe('Updated under CSP');
		expect(updates).toBe(1);
		expect(target.querySelector('[data-astra-view-reset]')).toBeNull();
		expect(violations).toHaveLength(previousViolations);
	} finally {
		release();
		handle.cancel();
		await handle.finished;
		iframe.remove();
	}
});
