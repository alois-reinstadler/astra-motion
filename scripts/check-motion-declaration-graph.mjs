import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Walks every relative declaration edge reachable from the package's published
// `types` entries. A strict consumer compile only follows the declarations it
// happens to import; this finds a missing file anywhere in the reachable graph.
// Salvaged from bewegung `src/lib/conformance/public-types.spec.ts` (c5c2d44).

const isFile = (path) => existsSync(path) && statSync(path).isFile();

/** Collect every `types` target from `exports` (nested conditions included) and `types`. */
export function declarationRoots(manifest) {
	const roots = new Set();
	const visit = (value, key) => {
		if (typeof value === 'string') {
			if (key === 'types' || key === 'typings') roots.add(value);
		} else if (value && typeof value === 'object')
			for (const [next, child] of Object.entries(value)) visit(child, next);
	};
	visit(manifest.exports);
	for (const key of ['types', 'typings'])
		if (typeof manifest[key] === 'string') visit(manifest[key], key);
	return [...roots].sort();
}

function candidates(path) {
	const declaration = /\.d\.[cm]?ts$/.test(path);
	if (declaration) return [path];
	const list = [];
	const script = path.match(/^(.*)\.([cm]?)[jt]s$/);
	if (script) list.push(`${script[1]}.d.${script[2]}ts`);
	// `./Card.svelte` resolves to `Card.svelte.d.ts`; extensionless paths try both.
	list.push(`${path}.d.ts`, `${path}.svelte.d.ts`, join(path, 'index.d.ts'));
	return list;
}

/** Resolve a relative specifier to an existing declaration file, or undefined. */
export function resolveDeclaration(fromFile, specifier) {
	return candidates(resolve(dirname(fromFile), specifier)).find(isFile);
}

/** Relative module references in a declaration file, with their kind. */
export function relativeReferences(sourceFile) {
	const found = [];
	const add = (specifier) => {
		if (specifier.startsWith('./') || specifier.startsWith('../')) found.push(specifier);
	};
	for (const reference of sourceFile.referencedFiles) add(reference.fileName);
	const visit = (node) => {
		if (
			(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
			node.moduleSpecifier &&
			ts.isStringLiteral(node.moduleSpecifier)
		)
			add(node.moduleSpecifier.text);
		else if (
			ts.isImportTypeNode(node) &&
			ts.isLiteralTypeNode(node.argument) &&
			ts.isStringLiteral(node.argument.literal)
		)
			add(node.argument.literal.text);
		ts.forEachChild(node, visit);
	};
	visit(sourceFile);
	return [...new Set(found)];
}

/**
 * Traverse the declaration graph of an installed or extracted package directory.
 * `missing` entries fail the check. `explicitAny` is informational: vendored Motion
 * declarations legitimately contain `any`, and Astra has no blanket ban.
 */
export function inspectDeclarationGraph(packageDirectory) {
	const directory = resolve(packageDirectory);
	const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
	const roots = declarationRoots(manifest);
	const missing = [];
	const explicitAny = [];
	const visited = new Set();
	const display = (file) => relative(directory, file).split(sep).join('/');
	for (const root of roots) {
		const entry = resolve(directory, root);
		if (!isFile(entry)) {
			missing.push({ root, file: 'package.json', specifier: root });
			continue;
		}
		const pending = [entry];
		while (pending.length > 0) {
			const file = pending.pop();
			if (visited.has(file)) continue;
			visited.add(file);
			const sourceFile = ts.createSourceFile(
				file,
				readFileSync(file, 'utf8'),
				ts.ScriptTarget.Latest,
				true
			);
			const scan = (node) => {
				if (node.kind === ts.SyntaxKind.AnyKeyword) {
					const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
					explicitAny.push({ file: display(file), line: line + 1 });
				}
				ts.forEachChild(node, scan);
			};
			scan(sourceFile);
			for (const specifier of relativeReferences(sourceFile)) {
				const target = resolveDeclaration(file, specifier);
				if (target) pending.push(target);
				else missing.push({ root, file: display(file), specifier });
			}
		}
	}
	return { roots, files: visited.size, missing, explicitAny };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
	const target = process.argv[2];
	if (!target) throw new Error('Pass an installed or extracted package directory.');
	const report = inspectDeclarationGraph(target);
	const vendored = report.explicitAny.filter(({ file }) => file.includes('/vendor/')).length;
	console.log(
		JSON.stringify(
			{
				roots: report.roots.length,
				declarationFiles: report.files,
				missing: report.missing,
				explicitAny: { vendored, owned: report.explicitAny.length - vendored }
			},
			null,
			2
		)
	);
	if (report.missing.length > 0) {
		for (const { root, file, specifier } of report.missing)
			console.error(`missing declaration: ${file} -> ${specifier} (root ${root})`);
		process.exitCode = 1;
	}
}
