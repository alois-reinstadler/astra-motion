interface ViewResources {
	readonly fontsWereLoaded: boolean;
	readonly images: ReadonlyMap<HTMLImageElement, string>;
}

const imageSource = (image: HTMLImageElement) =>
	JSON.stringify([image.currentSrc, image.src, image.srcset, image.sizes]);

/** Record existing loads so a transition never waits on unrelated, already pending resources. */
export function captureViewResources(document: Document): ViewResources {
	return {
		fontsWereLoaded: document.fonts?.status === 'loaded',
		images: new Map([...document.images].map((image) => [image, imageSource(image)]))
	};
}

/** React 19.3 bounds newly introduced font/image waits to 500ms; cancellation releases listeners. */
export async function waitForViewResources(
	document: Document,
	previous: ViewResources,
	signal: AbortSignal
): Promise<void> {
	if (signal.aborted) return;
	const waits: Promise<unknown>[] = [];
	const cleanup: (() => void)[] = [];
	// Force style/layout to discover any font requests caused by the committed update.
	document.documentElement?.getBoundingClientRect();
	if (previous.fontsWereLoaded && document.fonts?.status === 'loading')
		waits.push(document.fonts.ready);
	for (const image of document.images) {
		if (
			image.complete ||
			image.loading === 'lazy' ||
			image.decoding === 'async' ||
			previous.images.get(image) === imageSource(image)
		)
			continue;
		const box = image.getBoundingClientRect();
		const window = document.defaultView;
		if (
			!window ||
			box.bottom <= 0 ||
			box.right <= 0 ||
			box.top >= window.innerHeight ||
			box.left >= window.innerWidth
		)
			continue;
		waits.push(
			new Promise<void>((resolve) => {
				const ready = () => resolve();
				image.addEventListener('load', ready, { once: true });
				image.addEventListener('error', ready, { once: true });
				cleanup.push(() => {
					image.removeEventListener('load', ready);
					image.removeEventListener('error', ready);
				});
			})
		);
	}
	if (!waits.length) return;
	let timeout: ReturnType<typeof setTimeout> | undefined;
	let onAbort = () => {};
	try {
		await Promise.race([
			Promise.allSettled(waits),
			new Promise<void>((resolve) => {
				timeout = setTimeout(resolve, 500);
				onAbort = resolve;
				signal.addEventListener('abort', onAbort, { once: true });
			})
		]);
	} finally {
		clearTimeout(timeout);
		signal.removeEventListener('abort', onAbort);
		for (const dispose of cleanup) dispose();
	}
}
