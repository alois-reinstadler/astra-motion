import { flushSync, untrack } from 'svelte';

class RouteActivity {
	version = $state(0);
}

const documents = new WeakMap<Document, RouteActivity>();

function activity(document: Document) {
	let scope = documents.get(document);
	if (!scope) documents.set(document, (scope = new RouteActivity()));
	return scope;
}

/** Attachments inherit their Svelte branch's pause/resume lifetime during native outros. */
export function registerRouteActivity(node: HTMLElement): () => boolean {
	const scope = activity(node.ownerDocument);
	let observed = untrack(() => scope.version);
	$effect(() => {
		observed = scope.version;
	});
	return () => observed === scope.version;
}

/** Retained outgoing branches are paused; live branches acknowledge this checkpoint. */
export function checkpointRouteActivity(document: Document): void {
	const scope = activity(document);
	flushSync(() => scope.version++);
}
