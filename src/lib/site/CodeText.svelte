<script lang="ts">
	import { codeLanguage, highlightCode, type CodeLanguage } from './highlight.js';
	let {
		source,
		label = 'Example.svelte',
		dark = false,
		language
	}: { source: string; label?: string; dark?: boolean; language?: CodeLanguage } = $props();
	// Preserve source newlines across component boundaries and formatting.
	const newline = '\n';
	const lang = $derived(language ?? codeLanguage(source, label));
	const lines = $derived(highlightCode(source, lang, dark));
</script>

<code data-language={lang}
	>{#each lines as line, index (index)}{#if index > 0}{newline}{/if}{#each line as token, tokenIndex (tokenIndex)}<span
				style:color={token.color}
				style:font-style={token.fontStyle && token.fontStyle & 1 ? 'italic' : undefined}
				style:font-weight={token.fontStyle && token.fontStyle & 2 ? '600' : undefined}
				>{token.content}</span
			>{/each}{/each}</code
>
