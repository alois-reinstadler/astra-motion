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

import type { CodeLanguage } from './highlight.js';

export function highlightCode(source: string, language: CodeLanguage, dark = false) {
	return highlighter.codeToTokens(source, {
		lang: language,
		theme: dark ? 'github-dark' : 'github-light'
	}).tokens;
}
