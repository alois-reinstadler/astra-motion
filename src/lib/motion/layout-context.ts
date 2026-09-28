import { getContext, setContext } from 'svelte';
import type { LayoutController } from './layout.js';

export interface LayoutScope {
	id?: string;
	controller: LayoutController;
	cohort: object;
}
const key = Symbol('astra-layout-group');

export function readLayoutScope(): LayoutScope | undefined {
	try {
		return getContext<LayoutScope>(key);
	} catch (error) {
		if (error instanceof Error && error.message.includes('lifecycle_outside_component')) return;
		throw error;
	}
}

export function provideLayoutScope(scope: LayoutScope) {
	setContext(key, scope);
}
