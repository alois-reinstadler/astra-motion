import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { cdp, commands } from 'vitest/browser';
import Benchmark from '../src/lib/motion-lab/Benchmark.svelte';

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
it('captures first and warm reversal renderer traces', async () => {
	const variant = (import.meta.env.VITE_PROFILE_VARIANT as string | undefined) ?? 'baseline';
	const session = cdp();
	let finish: (handle: string) => void = () => {};
	const completed = new Promise<string>((resolve) => {
		finish = resolve;
	});
	const onComplete = (event: { stream?: string }) => finish(event.stream ?? '');
	session.on('Tracing.tracingComplete', onComplete);
	await session.send('Tracing.start', {
		categories:
			'-*,devtools.timeline,blink.user_timing,toplevel,v8,cc,gpu,blink,disabled-by-default-devtools.timeline.frame',
		transferMode: 'ReturnAsStream'
	});
	performance.mark('profile-mount-start');
	const view = await render(Benchmark, {
		count: 500,
		backend: variant === 'instant' ? 'instant' : 'motion'
	});
	const grid = document.querySelector<HTMLElement>('.benchmark-grid')!;
	if (variant === 'will-change')
		for (const item of grid.children) (item as HTMLElement).style.willChange = 'transform';
	if (variant === 'contain-grid') grid.style.contain = 'layout paint';
	performance.mark('profile-mount-end');
	await pause(500);
	for (let iteration = 0; iteration < 3; iteration++) {
		performance.mark(`profile-${iteration}-start`);
		view.component.reorder();
		performance.mark(`profile-${iteration}-transaction-end`);
		await pause(1000);
		performance.mark(`profile-${iteration}-end`);
		expect(view.component.stats().active).toBe(0);
	}
	await session.send('Tracing.end');
	const handle = await completed;
	session.off('Tracing.tracingComplete', onComplete);
	expect(handle).not.toBe('');
	let trace = '';
	while (true) {
		const result = await session.send('IO.read', { handle });
		trace += result.data;
		if (result.eof) break;
	}
	await session.send('IO.close', { handle });
	await commands.writeFile(`docs/research/.profile-layout-${variant}-trace.json`, trace);
	await view.unmount();
}, 20000);
