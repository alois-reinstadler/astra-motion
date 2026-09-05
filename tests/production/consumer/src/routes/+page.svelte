<script lang="ts">
	import * as entry0 from 'astra-motion';
	import * as entry1 from 'astra-motion/layout';
	import * as entry2 from 'astra-motion/presence';
	import * as entry3 from 'astra-motion/routes';
	import * as entry4 from 'astra-motion/policy';
	import * as entry5 from 'astra-motion/state';
	import * as entry6 from 'astra-motion/values';
	import * as entry7 from 'astra-motion/animate';
	import * as entry8 from 'astra-motion/scroll';
	import * as entry9 from 'astra-motion/state/lite';
	import * as entry10 from 'astra-motion/in-view';
	const entries = [
		{ name: '.', exports: Object.keys(entry0).sort() },
		{ name: './layout', exports: Object.keys(entry1).sort() },
		{ name: './presence', exports: Object.keys(entry2).sort() },
		{ name: './routes', exports: Object.keys(entry3).sort() },
		{ name: './policy', exports: Object.keys(entry4).sort() },
		{ name: './state', exports: Object.keys(entry5).sort() },
		{ name: './values', exports: Object.keys(entry6).sort() },
		{ name: './animate', exports: Object.keys(entry7).sort() },
		{ name: './scroll', exports: Object.keys(entry8).sort() },
		{ name: './state/lite', exports: Object.keys(entry9).sort() },
		{ name: './in-view', exports: Object.keys(entry10).sort() }
	];
</script>

<h1>Packed export surface</h1>
<p>Every public entry is resolved from the installed tarball.</p>
{#each entries as entry (entry.name)}<section data-export={entry.name}>
		<h2>{entry.name}</h2>
		<p>{entry.exports.join(', ')}</p>
	</section>{/each}
