import { createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import svelte from 'shiki/langs/svelte.mjs';
import typescript from 'shiki/langs/typescript.mjs';
import shell from 'shiki/langs/shellscript.mjs';
import json from 'shiki/langs/json.mjs';
import light from 'shiki/themes/github-light.mjs';
import dark from 'shiki/themes/github-dark.mjs';

// Only the site's languages and two themes; no WASM or full language bundle.
const highlighter = createHighlighterCoreSync({
	langs: [svelte, typescript, shell, json],
	themes: [light, dark],
	engine: createJavaScriptRegexEngine()
});

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

export function highlightCode(source: string, language: CodeLanguage, dark = false) {
	return highlighter.codeToTokens(source, {
		lang: language,
		theme: dark ? 'github-dark' : 'github-light'
	}).tokens;
}
