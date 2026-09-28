declare module '@fixture' {
	const component: import('svelte').Component;
	export default component;
}
declare interface Window {
	__astra?: {
		readTime(): number;
		frames(): number;
		set(value: number): void;
		read(): number;
		destroyed(): number;
		active(): number;
	};
	__original?: Element | null;
}
