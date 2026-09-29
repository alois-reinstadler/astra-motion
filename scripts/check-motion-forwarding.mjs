#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parse } from 'svelte/compiler';

/** Conservative static check for a component intended for motion.create(). */
export function checkMotionForwarding(source) {
	const ast = parse(source, { modern: true });
	let native = false;
	let forwarding = false;
	let delegated = false;
	function visit(node) {
		if (!node || typeof node !== 'object') return;
		if (node.type === 'RegularElement' || node.type === 'SvelteElement') native = true;
		if (node.type === 'SpreadAttribute' || node.type === 'AttachTag') forwarding = true;
		// A child component/snippet may own the root; do not guess at its lifecycle.
		if (node.type === 'Component' || node.type === 'SvelteComponent') delegated = true;
		for (const value of Object.values(node)) {
			if (Array.isArray(value)) value.forEach(visit);
			else if (value && typeof value === 'object') visit(value);
		}
	}
	visit(ast.fragment);
	return native && !forwarding && !delegated
		? [
				'Astra Motion [attachment-forwarding]: this custom component renders native markup without forwarding attachment props. Destructure children and spread the remaining $props() onto the animated native root.'
			]
		: [];
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
	const files = process.argv.slice(2);
	if (!files.length)
		throw new Error('Pass the Svelte component files you intend to wrap with motion.create().');
	let failures = 0;
	for (const file of files) {
		for (const message of checkMotionForwarding(await readFile(file, 'utf8'))) {
			console.error(`${file}: ${message}`);
			failures++;
		}
	}
	process.exitCode = failures ? 1 : 0;
}
