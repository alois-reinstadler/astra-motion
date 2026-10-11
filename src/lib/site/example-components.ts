import type { Component } from 'svelte';

const components = import.meta.glob<Component>(
	['./examples/*.svelte', './snippet-previews/*--*.svelte'],
	{ import: 'default' }
);

export async function loadExampleComponent(path: string): Promise<Component> {
	const load = components[path];
	if (!load) throw new Error(`Unknown example component: ${path}`);
	return load();
}
