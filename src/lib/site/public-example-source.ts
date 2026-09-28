/** Keep preview source and copyable package imports in one canonical transformation. */
export function publicExampleSource(source: string): string {
	return source
		.replaceAll("'$lib/motion/index.js'", "'astra-motion'")
		.replaceAll("'$lib/motion/lazy-entry.js'", "'astra-motion/lazy'")
		.replaceAll("'$lib/motion/m/index.js'", "'astra-motion/m'")
		.replaceAll("'$lib/motion/dom-animation.js'", "'astra-motion/features/dom-animation'")
		.replaceAll("'$lib/motion/dom-max.js'", "'astra-motion/features/dom-max'");
}
