import { getContext, setContext } from 'svelte';
const key = Symbol('astra-element-namespace');
export function readSVGContext() {
	return getContext<boolean>(key) ?? false;
}
export function provideSVGContext(svg: boolean) {
	setContext(key, svg);
}
