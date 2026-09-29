<script lang="ts">
	import { resolve } from '$app/paths';
	import { docs, type DocPage } from './docs.js';
	import DocCode from './DocCode.svelte';
	import DocExample from './DocExample.svelte';
	import { getExample } from './examples.js';
	import { getSnippetPreview } from './snippet-previews.js';
	let { doc }: { doc: DocPage } = $props();
	const index = $derived(docs.findIndex((entry) => entry.slug === doc.slug));
	const previous = $derived(docs[index - 1]);
	const next = $derived(docs[index + 1]);
</script>

<div class="article-layout">
	<article>
		<header>
			<p class="eyebrow">DOCUMENTATION <span>/</span> {doc.group.toUpperCase()}</p>
			<h1>{doc.title}</h1>
			<p class="lede">{doc.summary}</p>
			<details class="compact-contents">
				<summary>On this page <span aria-hidden="true">+</span></summary>
				<nav aria-label="Article sections">
					{#each doc.sections as section (section.id)}
						<a href={`#${section.id}`}>{section.title}</a>
					{/each}
				</nav>
			</details>
		</header>
		{#each doc.sections as section (section.id)}
			{@const example = getExample(section.example ?? '')}
			{@const snippetPreview = getSnippetPreview(doc, section)}
			<section id={section.id}>
				{#each section.aliases ?? [] as alias (alias)}<span
						id={alias}
						class="anchor-alias"
						aria-hidden="true"
					></span>{/each}
				<h2><a href={`#${section.id}`}>{section.title}<span aria-hidden="true">#</span></a></h2>
				{#each section.text as paragraph (paragraph)}<p>{paragraph}</p>{/each}
				{#if section.points}<ul>
						{#each section.points as point (point)}<li>{point}</li>{/each}
					</ul>{/if}
				{#if section.table}
					<!-- svelte-ignore a11y_no_noninteractive_tabindex (The overflow region needs keyboard scrolling.) -->
					<div
						class="reference-table"
						role="region"
						aria-label={`${section.title} reference`}
						tabindex="0"
					>
						<table>
							<thead
								><tr
									>{#each section.table.columns as column (column)}<th scope="col">{column}</th
										>{/each}</tr
								></thead
							>
							<tbody
								>{#each section.table.rows as row, index (index)}<tr
										>{#each row as cell, columnIndex (columnIndex)}{#if columnIndex === 0}<th
													scope="row">{cell}</th
												>{:else}<td>{cell}</td>{/if}{/each}</tr
									>{/each}</tbody
							>
						</table>
					</div>
				{/if}
				{#if snippetPreview}
					<DocExample example={snippetPreview} defer />
				{:else if section.code}
					<DocCode source={section.code.source} label={section.code.label} />
				{/if}
				{#if example}
					<DocExample {example} />
				{/if}
				{#if section.links}<nav class="reading-path" aria-label={`${section.title} links`}>
						{#each section.links as link (link.title)}
							<a
								href={link.path
									? resolve(link.path)
									: resolve('/docs/[slug]', { slug: link.slug! })}
								><strong>{link.title}</strong><span>{link.detail}</span></a
							>
						{/each}
					</nav>{/if}
				{#if section.related}<nav class="related" aria-label={`${section.title} guides`}>
						{#each section.related as slug (slug)}<a href={resolve('/docs/[slug]', { slug })}
								>{docs.find((entry) => entry.slug === slug)?.title}
							</a>{/each}
					</nav>{/if}
			</section>
		{/each}
		<nav class="page-navigation" aria-label="Previous and next guide">
			{#if previous}<a
					href={previous.slug ? resolve('/docs/[slug]', { slug: previous.slug }) : resolve('/docs')}
					><span> Previous</span><strong>{previous.title}</strong></a
				>{:else}<div></div>{/if}
			{#if next}<a class="next" href={resolve('/docs/[slug]', { slug: next.slug })}
					><span>Next </span><strong>{next.title}</strong></a
				>{/if}
		</nav>
	</article>
	<aside class="on-this-page">
		<nav aria-label="On this page">
			<p>ON THIS PAGE</p>
			{#each doc.sections as section (section.id)}<a href={`#${section.id}`}>{section.title}</a
				>{/each}
		</nav>
		<div class="status">
			<span class="dot"></span> <a href={resolve('/status')}>Working beta</a>
			<p>Svelte 5 · Motion 13<br />Native elements throughout.</p>
		</div>
	</aside>
</div>

<style>
	.reference-table {
		width: 100%;
		overflow: auto;
		margin: 24px 0;
		border: 1px solid var(--site-line);
		border-radius: 5px;
	}
	table {
		border-collapse: collapse;
		width: 100%;
		min-width: 520px;
		text-align: left;
		font-size: 12px;
		line-height: 1.7;
	}
	th,
	td {
		padding: 13px 15px;
		border-bottom: 1px solid var(--site-line);
		vertical-align: top;
		overflow-wrap: anywhere;
	}
	thead {
		background: var(--site-panel);
	}
	th {
		font-weight: 550;
	}
	td {
		color: var(--site-muted);
	}
	tbody tr:last-child th,
	tbody tr:last-child td {
		border-bottom: 0;
	}

	.anchor-alias {
		display: block;
		scroll-margin-top: 30px;
	}
	.reading-path {
		display: grid;
		border-top: 1px solid var(--site-line);
		margin-top: 24px;
	}
	.reading-path a {
		display: grid;
		grid-template-columns: 180px 1fr;
		gap: 20px;
		padding: 18px 0;
		border-bottom: 1px solid var(--site-line);
		text-decoration: none;
		font-size: 14px;
	}
	.reading-path strong {
		font-weight: 550;
	}
	.reading-path span {
		color: var(--site-muted);
		line-height: 1.6;
	}
	.reading-path a:hover strong {
		color: var(--site-accent);
	}
	@media (max-width: 600px) {
		.reading-path a {
			grid-template-columns: 1fr;
			gap: 5px;
		}
	}

	.compact-contents {
		display: none;
		margin-top: 26px;
		border-top: 1px solid var(--site-line);
	}
	.compact-contents summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 0 0;
		font-size: 12px;
		cursor: pointer;
		list-style: none;
	}
	.compact-contents summary::-webkit-details-marker {
		display: none;
	}
	.compact-contents summary span {
		color: var(--site-accent);
		font-size: 18px;
	}
	.compact-contents[open] summary span {
		transform: rotate(45deg);
	}
	.compact-contents nav {
		display: grid;
		gap: 12px;
		padding-top: 20px;
	}
	.compact-contents a {
		color: var(--site-muted);
		font-size: 13px;
		text-underline-offset: 4px;
	}
	.article-layout {
		display: grid;
		grid-template-columns: minmax(0, 750px) 160px;
		gap: 54px;
		min-width: 0;
	}
	article {
		min-width: 0;
	}
	header {
		padding-bottom: 35px;
		margin-bottom: 40px;
		border-bottom: 1px solid var(--site-line);
	}
	.eyebrow {
		color: var(--site-muted);
		font-size: 11px;
		letter-spacing: 1.3px;
		line-height: 1.8;
		font-weight: 600;
	}
	.eyebrow span {
		padding: 0 9px;
		color: #a2a693;
	}
	h1 {
		margin: 24px 0 20px;
		font-size: clamp(36px, 4vw, 56px);
		line-height: 1.07;
		letter-spacing: -2.4px;
		font-weight: 500;
		color: var(--site-ink);
	}
	.lede {
		max-width: 650px;
		color: var(--site-muted);
		font-size: 17px;
		line-height: 1.65;
	}
	section {
		margin-bottom: 47px;
		scroll-margin-top: 30px;
	}
	h2 {
		margin: 0 0 18px;
		font-size: 23px;
		font-weight: 500;
		letter-spacing: -0.6px;
		line-height: 1.3;
		color: var(--site-ink);
	}
	h2 a {
		text-decoration: none;
		color: inherit;
	}
	h2 span {
		color: var(--site-accent);
		opacity: 0;
		margin-left: 10px;
		font-size: 17px;
	}
	h2 a:hover span,
	h2 a:focus-visible span {
		opacity: 1;
	}
	section > p {
		color: var(--site-muted);
		font-size: 15px;
		line-height: 1.8;
		margin: 16px 0;
	}
	ul {
		list-style-type: disc;
		padding-left: 19px;
		color: var(--site-muted);
		font-size: 14px;
		line-height: 1.8;
	}
	li {
		padding-left: 3px;
		margin: 10px 0;
	}
	li::marker {
		color: var(--site-accent);
	}
	.related {
		display: flex;
		flex-wrap: wrap;
		gap: 10px 20px;
		margin-top: 20px;
	}
	.related a {
		color: var(--site-accent);
		font-size: 12px;
		text-decoration: none;
	}
	.related a:hover {
		text-decoration: underline;
	}
	.on-this-page {
		position: sticky;
		top: 34px;
		align-self: start;
	}
	.on-this-page nav > p {
		font-size: 11px;
		letter-spacing: 1.1px;
		color: var(--site-muted);
		margin: 0 0 16px;
	}
	.on-this-page nav a {
		display: block;
		color: var(--site-muted);
		font-size: 11px;
		line-height: 1.55;
		padding: 7px 0;
		text-decoration: none;
	}
	.on-this-page nav a:hover {
		color: var(--site-accent);
	}
	.status {
		margin-top: 32px;
		border-top: 1px solid var(--site-line);
		padding-top: 20px;
		font-size: 11px;
		color: var(--site-ink);
	}
	.dot {
		display: inline-block;
		width: 5px;
		height: 5px;
		background: var(--site-accent);
		border-radius: 50%;
		margin-right: 6px;
	}
	.status p {
		margin-top: 10px;
		font-size: 10px;
		color: var(--site-muted);
		line-height: 1.8;
	}
	.page-navigation {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 30px;
		border-top: 1px solid var(--site-line);
		padding: 26px 0 10px;
	}
	.page-navigation a {
		color: var(--site-ink);
		text-decoration: none;
	}
	.page-navigation a:hover strong {
		color: var(--site-accent);
	}
	.page-navigation span {
		display: block;
		font-size: 10px;
		color: var(--site-muted);
		margin-bottom: 9px;
	}
	.page-navigation strong {
		font-size: 14px;
		font-weight: 500;
	}
	.next {
		text-align: right;
	}
	:focus-visible {
		outline: 2px solid var(--site-accent);
		outline-offset: 4px;
	}
	@media (max-width: 1200px) {
		.compact-contents {
			display: block;
		}
		.article-layout {
			grid-template-columns: minmax(0, 1fr);
		}
		.on-this-page {
			display: none;
		}
	}
	@media (max-width: 600px) {
		h1 {
			letter-spacing: -1.7px;
		}
		.lede {
			font-size: 16px;
		}
		h2 {
			font-size: 21px;
		}
		header {
			margin-bottom: 34px;
			padding-bottom: 28px;
		}
	}
</style>
