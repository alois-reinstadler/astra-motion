export type CodeLanguage =
	'svelte' | 'typescript' | 'javascript' | 'css' | 'shellscript' | 'json' | 'text';
export function codeLanguage(source: string, label: string): CodeLanguage {
	if (/\.svelte$/i.test(label) || /^\s*<(?:script|style|[a-z][\w-]*)(?:\s|>)/m.test(source))
		return 'svelte';
	if (/\.jsonc?$/i.test(label)) return 'json';
	if (/\.css$/i.test(label)) return 'css';
	if (/\.(?:mjs|cjs|js)$/i.test(label)) return 'javascript';
	if (/\.(?:sh|bash)$|terminal|shell/i.test(label) || /^(?:pnpm|bun|npm|yarn|npx)\s/m.test(source))
		return 'shellscript';
	if (/\.txt$/i.test(label)) return 'text';
	return 'typescript';
}

export interface HighlightToken {
	content: string;
	color?: string;
	fontStyle?: number;
}

// Store lengths rather than a second copy of the source in serialized page data.
export interface PreparedHighlight {
	palette: string[];
	lines: [number, number, number?][][];
}
export type PreparedHighlights = Record<string, PreparedHighlight>;
export interface HighlightSource {
	source: string;
	label?: string;
	language?: CodeLanguage;
	dark?: boolean;
}

export function highlightKey(source: string, language: CodeLanguage, dark = false): string {
	// Two independently seeded 32-bit hashes keep lookup keys small in page data.
	let first = 2166136261;
	let second = 5381;
	for (let i = 0; i < source.length; i++) {
		first = Math.imul(first ^ source.charCodeAt(i), 16777619);
		second = Math.imul(second, 33) ^ source.charCodeAt(i);
	}
	return `${language}:${dark ? 'dark' : 'light'}:${source.length}:${first >>> 0}:${second >>> 0}`;
}

export function packHighlight(lines: HighlightToken[][]): PreparedHighlight {
	const palette: string[] = [];
	return {
		palette,
		lines: lines.map((line) =>
			line.map((token) => {
				const color = token.color ?? '';
				let index = palette.indexOf(color);
				if (index < 0) index = palette.push(color) - 1;
				return token.fontStyle
					? [token.content.length, index, token.fontStyle]
					: [token.content.length, index];
			})
		)
	};
}

export function unpackHighlight(source: string, prepared: PreparedHighlight): HighlightToken[][] {
	const sourceLines = source.split(/\r?\n/);
	return prepared.lines.map((line, lineIndex) => {
		let offset = 0;
		return line.map(([length, color, fontStyle]) => {
			const content = sourceLines[lineIndex].slice(offset, offset + length);
			offset += length;
			return { content, color: prepared.palette[color] || undefined, fontStyle };
		});
	});
}

// Uncatalogued, dynamically supplied code is the only case that loads Shiki in
// the browser. Static documentation and examples use prepared page data.
export async function highlightDynamic(source: string, language: CodeLanguage, dark = false) {
	const { highlightCode } = await import('./highlight-runtime.js');
	return highlightCode(source, language, dark);
}
