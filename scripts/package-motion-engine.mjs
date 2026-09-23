import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	realpathSync,
	rmSync,
	writeFileSync
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { parse } from 'svelte/compiler';

// Package the reviewed DOM-only ESM graph, preserving its module boundaries for
// downstream tree shaking. This changes import locations, never upstream runtime
// code. Source development still uses the same locked, unmodified dependencies.
const root = fileURLToPath(new URL('..', import.meta.url));
const output = join(root, 'dist/motion');
const vendor = join(output, 'vendor');
const require = createRequire(import.meta.url);
const reviewed = JSON.parse(
	readFileSync(join(root, 'tests/upstream-motion/reviewed-exports.json'), 'utf8')
);
const versions = { ...reviewed.pins, ...reviewed.resolved };
const packages = new Map();
for (const name of ['motion-dom', 'motion-utils', 'framer-motion']) {
	let directory = dirname(realpathSync(require.resolve(name)));
	while (!existsSync(join(directory, 'package.json'))) directory = dirname(directory);
	const metadata = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
	assert.equal(metadata.name, name);
	assert.equal(metadata.version, versions[name], `Review ${name} before packaging an upgrade`);
	packages.set(name, {
		directory,
		entry: name === 'framer-motion' ? 'dist/es/dom.mjs' : 'dist/es/index.mjs',
		types: name === 'framer-motion' ? 'dist/dom.d.ts' : 'dist/index.d.ts'
	});
}
function rewriteImports(code, file, rewrite) {
	const edits = [];
	function inspect(script, offset = 0) {
		const ast = ts.createSourceFile(file, script, ts.ScriptTarget.Latest, true);
		function visit(node) {
			let specifier;
			if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
				specifier = node.moduleSpecifier;
			else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
				specifier = node.argument.literal;
			else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword)
				specifier = node.arguments[0];
			if (specifier && ts.isStringLiteral(specifier)) {
				const next = rewrite(specifier.text);
				if (next !== specifier.text)
					edits.push({
						start: offset + specifier.getStart(ast) + 1,
						end: offset + specifier.end - 1,
						next
					});
			}
			ts.forEachChild(node, visit);
		}
		visit(ast);
	}
	if (file.endsWith('.svelte')) {
		const component = parse(code, { modern: true });
		for (const script of [component.module, component.instance]) {
			if (script)
				inspect(code.slice(script.content.start, script.content.end), script.content.start);
		}
	} else inspect(code);
	for (const { start, end, next } of edits.sort((a, b) => b.start - a.start))
		code = code.slice(0, start) + next + code.slice(end);
	return code;
}
const relativeImport = (file, target) => {
	const path = relative(dirname(file), target).replaceAll('\\', '/');
	return path.startsWith('.') ? path : './' + path;
};
const packageName = (specifier) => (specifier === 'motion' ? 'framer-motion' : specifier);
const packagedEntry = (name) => join(vendor, name, 'index.js');
const copied = new Set();
const sourceHashes = {};
const digest = (text) => createHash('sha256').update(text).digest('hex');

rmSync(vendor, { recursive: true, force: true });
function copyModule(name, path) {
	const id = name + '/' + path;
	if (copied.has(id)) return;
	copied.add(id);
	const upstream = packages.get(name);
	const source = readFileSync(join(upstream.directory, path), 'utf8');
	sourceHashes[id] = digest(source);
	const destination = join(vendor, id);
	const code = rewriteImports(source, destination, (specifier) => {
		if (specifier.startsWith('.')) {
			const dependency = relative(
				upstream.directory,
				resolve(upstream.directory, dirname(path), specifier)
			);
			assert(!dependency.startsWith('..'), `Import escapes ${name}: ${specifier}`);
			copyModule(name, dependency);
			return specifier;
		}
		assert(packages.has(specifier), `Unexpected dependency in DOM engine: ${specifier}`);
		return relativeImport(destination, packagedEntry(specifier));
	}).replace(/^\/\/# sourceMappingURL=.*$/gm, '');
	mkdirSync(dirname(destination), { recursive: true });
	writeFileSync(destination, code);
}

for (const [name, upstream] of packages) {
	copyModule(name, upstream.entry);
	const entry = packagedEntry(name);
	writeFileSync(entry, `export * from './${upstream.entry}';\n`);
	const source = readFileSync(join(upstream.directory, upstream.types), 'utf8');
	sourceHashes[name + '/' + upstream.types] = digest(source);
	let declarations = source;
	if (name === 'framer-motion') {
		// Upstream's DOM declarations accidentally include an Electron-only tag
		// whose type is absent from lib.dom. Astra's public HTML API excludes it.
		// Remove that unsupported member, rather than inventing an ambient DOM type.
		const defect = /^[ ]{4}webview: HTMLWebViewElement;\r?\n/gm;
		assert.equal(
			[...declarations.matchAll(defect)].length,
			1,
			'Review the upstream declaration correction'
		);
		declarations = declarations.replace(defect, '');
	}
	declarations = rewriteImports(declarations, entry + '.d.ts', (specifier) => {
		assert(packages.has(specifier), `Unexpected type dependency: ${specifier}`);
		return relativeImport(entry, packagedEntry(specifier));
	});
	writeFileSync(entry.replace(/\.js$/, '.d.ts'), declarations);
	const license = ['LICENSE', 'LICENSE.md'].find((file) =>
		existsSync(join(upstream.directory, file))
	);
	assert(license, `Missing upstream license for ${name}`);
	writeFileSync(join(vendor, name, 'LICENSE'), readFileSync(join(upstream.directory, license)));
}

// Every Astra import (including declarations and uncompiled Svelte components)
// must refer to this one engine. No consumer dependency resolution is involved.
for (const path of readdirSync(output, { recursive: true })) {
	if (path.startsWith('vendor/') || !/\.(?:js|ts|svelte)$/.test(path)) continue;
	const file = join(output, path);
	const source = readFileSync(file, 'utf8');
	const code = rewriteImports(source, file, (specifier) => {
		const name = packageName(specifier);
		return packages.has(name) ? relativeImport(file, packagedEntry(name)) : specifier;
	});
	if (code !== source) writeFileSync(file, code);
}

writeFileSync(
	join(vendor, 'provenance.json'),
	JSON.stringify(
		{
			versions: Object.fromEntries([...packages.keys()].map((name) => [name, versions[name]])),
			upstream: 'https://github.com/motiondivision/motion',
			transforms: [
				'Relative module imports; original ESM boundaries retained',
				'Source-map comments removed',
				'Removed unsupported Electron webview member from framer-motion DOM declarations'
			],
			sourceHashes
		},
		null,
		'\t'
	) + '\n'
);
console.log(
	`Packaged one Motion DOM engine: ${copied.size} ESM modules, ${JSON.stringify(versions)}`
);
