<script lang="ts">
	import { page } from '$app/state';
	import {
		codeLanguage,
		highlightKey,
		unpackHighlight,
		highlightDynamic,
		type CodeLanguage,
		type HighlightToken
	} from './highlight.js';
	let {
		source,
		label = 'Example.svelte',
		dark = false,
		language
	}: { source: string; label?: string; dark?: boolean; language?: CodeLanguage } = $props();
	// Preserve source newlines across component boundaries and formatting.
	const newline = '\n';
	const lang = $derived(language ?? codeLanguage(source, label));
	const prepared = $derived(page.data.highlights?.[highlightKey(source, lang, dark)]);
	const lines = $derived(prepared ? unpackHighlight(source, prepared) : undefined);
	const fallback = $derived(lines ? undefined : highlightDynamic(source, lang, dark));
</script>

{#snippet coloredLines(lines: HighlightToken[][])}
	{#each lines as line, index (index)}{#if index > 0}{newline}{/if}{#each line as token, tokenIndex (tokenIndex)}<span
				style:color={token.color}
				style:font-style={token.fontStyle && token.fontStyle & 1 ? 'italic' : undefined}
				style:font-weight={token.fontStyle && token.fontStyle & 2 ? '600' : undefined}
				>{token.content}</span
			>{/each}{/each}
{/snippet}

<code data-language={lang}
	>{#if lines}{@render coloredLines(
			lines
		)}{:else}{#await fallback}{source}{:then highlighted}{#if highlighted}{@render coloredLines(
					highlighted
				)}{:else}{source}{/if}{:catch}{source}{/await}{/if}</code
>
