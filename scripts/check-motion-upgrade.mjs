/** Read-only package-boundary gate. Run the browser contracts and existing regression suites too. */
import { readFileSync, readdirSync, existsSync, realpathSync } from 'node:fs';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parse } from 'svelte/compiler';
import ts from 'typescript';
import * as motion from 'motion';
import * as dom from 'motion-dom';

const root = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
const reviewed = JSON.parse(
	readFileSync(join(root, 'tests/upstream-motion/reviewed-exports.json'), 'utf8')
);
const project = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const errors = [];
const assert = (condition, message) => {
	if (!condition) errors.push(message);
};

// Metadata is read from disk after resolving a public entry: package.json is not
// itself an exported subpath of motion-dom. No internal JavaScript is imported.
function metadata(name, resolver = require) {
	const entry = realpathSync(resolver.resolve(name));
	let directory = dirname(entry);
	while (dirname(directory) !== directory) {
		const file = join(directory, 'package.json');
		if (existsSync(file)) {
			const value = JSON.parse(readFileSync(file, 'utf8'));
			if (value.name === name) return { ...value, file, entry, directory };
		}
		directory = dirname(directory);
	}
	throw new Error(`Could not locate metadata for ${name}`);
}
const motionPackage = metadata('motion');
const domPackage = metadata('motion-dom');
const framer = metadata('framer-motion', createRequire(motionPackage.entry));
const utils = metadata('motion-utils', createRequire(domPackage.entry));
const packages = {
	motion: motionPackage,
	'motion-dom': domPackage,
	'framer-motion': framer,
	'motion-utils': utils
};
for (const [name, version] of Object.entries(reviewed.pins)) {
	assert(
		project.devDependencies?.[name] === version,
		`${name} must be an exact direct pin ${version}; review before changing it`
	);
	assert(
		packages[name].version === version,
		`${name} resolves to ${packages[name].version}, expected ${version}`
	);
}
for (const [name, version] of Object.entries(reviewed.resolved))
	assert(
		packages[name].version === version,
		`${name} resolved version changed from qualified ${version} to ${packages[name].version}`
	);
for (const dependency of Object.keys({ ...project.dependencies, ...project.devDependencies })) {
	assert(
		!['react', 'react-dom', 'svelte-motion', '@humanspeak/svelte-motion'].includes(dependency),
		`Forbidden direct runtime strategy: ${dependency}`
	);
}
for (const name of Object.keys(project.pnpm?.patchedDependencies ?? {}))
	assert(
		!/^(motion|motion-dom|motion-utils|framer-motion)(@|$)/.test(name),
		`Motion dependency patch needs explicit architectural review: ${name}`
	);
assert(
	!domPackage.entry.includes('_patch_hash='),
	'The resolved motion-dom install contains a pnpm dependency patch'
);
assert(
	metadata('motion-dom', createRequire(framer.entry)).directory === domPackage.directory,
	'Motion vanilla and the direct adapter resolve different motion-dom installations'
);
for (const name of ['framer-motion', 'motion-utils'])
	assert(
		metadata(name).directory === packages[name].directory,
		`Direct and transitive ${name} resolve different installations`
	);
assert(
	metadata('motion-utils', createRequire(framer.entry)).directory === utils.directory,
	'Framer Motion and motion-dom resolve different motion-utils installations'
);
for (const name of [
	'HTMLVisualElement',
	'AsyncMotionValueAnimation',
	'NativeAnimationExtended',
	'GroupAnimation',
	'frame',
	'visualElementStore',
	'styleEffect',
	'svgEffect'
])
	assert(motion[name] === dom[name], `${name} identity differs between motion and motion-dom`);

const apiModules = { motion, 'motion-dom': dom };
const observed = new Map();
const typeImports = [];
const sources = readdirSync(join(root, 'src/lib/motion'), { recursive: true })
	.filter(
		(file) => (file.endsWith('.ts') || file.endsWith('.svelte')) && !file.endsWith('.spec.ts')
	)
	.map((file) => join(root, 'src/lib/motion', file));
sources.push(join(root, 'src/lib/index.ts'));
function inspectSource(code, file) {
	const ast = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
	const label = relative(root, file);
	function inspectImport(source, bindings = [], typeOnly = false) {
		if (!source) return;
		assert(
			!/^(react(?:-dom)?|framer-motion|svelte-motion|@humanspeak\/svelte-motion)(\/|$)/.test(
				source
			),
			`${label}: forbidden framework import ${source}`
		);
		if (!/^(motion|motion-dom|motion-utils)(\/|$)/.test(source)) return;
		assert(
			['motion', 'motion-dom', 'motion-utils'].includes(source),
			`${label}: unreviewed Motion subpath/deep import ${source}`
		);
		if (!['motion', 'motion-dom', 'motion-utils'].includes(source)) return;
		for (const binding of bindings) {
			const name = binding.propertyName?.text ?? binding.name.text;
			if (typeOnly || binding.isTypeOnly) {
				typeImports.push({ source, name, label });
				continue;
			}
			if (!observed.has(source)) observed.set(source, new Set());
			observed.get(source).add(name);
			assert(
				name in (apiModules[source] ?? {}),
				`${label}: ${source} no longer exports runtime ${name}`
			);
		}
	}
	for (const statement of ast.statements) {
		if (ts.isImportDeclaration(statement)) {
			const clause = statement.importClause;
			const bindings = clause?.namedBindings;
			const source = statement.moduleSpecifier.text;
			if (/^(motion|motion-dom|motion-utils)$/.test(source))
				assert(
					!clause?.name && (!bindings || ts.isNamedImports(bindings)),
					`${label}: namespace/default Motion imports require an explicit named surface review`
				);
			inspectImport(
				source,
				bindings && ts.isNamedImports(bindings) ? bindings.elements : [],
				clause?.isTypeOnly
			);
		} else if (ts.isExportDeclaration(statement)) {
			const source = statement.moduleSpecifier?.text;
			if (source && /^(motion|motion-dom|motion-utils)$/.test(source))
				assert(
					!!statement.exportClause && ts.isNamedExports(statement.exportClause),
					`${label}: wildcard Motion re-export expands the unreviewed public surface`
				);
			inspectImport(
				source,
				statement.exportClause && ts.isNamedExports(statement.exportClause)
					? statement.exportClause.elements
					: [],
				statement.isTypeOnly
			);
		}
	}
	function visit(node) {
		if (
			ts.isCallExpression(node) &&
			(node.expression.kind === ts.SyntaxKind.ImportKeyword ||
				(ts.isIdentifier(node.expression) && node.expression.text === 'require'))
		) {
			const argument = node.arguments[0];
			if (argument && ts.isStringLiteralLike(argument)) {
				assert(
					!/^(motion|motion-dom|motion-utils)(\/|$)/.test(argument.text),
					`${label}: dynamic Motion imports require a new explicit surface review`
				);
				inspectImport(argument.text);
			} else
				assert(
					false,
					`${label}: a computed module import cannot be checked by the package-boundary gate`
				);
		}
		ts.forEachChild(node, visit);
	}
	visit(ast);
}
for (const file of sources) {
	const code = readFileSync(file, 'utf8');
	if (file.endsWith('.svelte')) {
		const ast = parse(code, { modern: true });
		for (const script of [ast.instance, ast.module])
			if (script) inspectSource(code.slice(script.content.start, script.content.end), file);
	} else inspectSource(code, file);
}
for (const source of new Set([...observed.keys(), ...Object.keys(reviewed.exports)])) {
	const actual = [...(observed.get(source) ?? [])].sort();
	const expected = [...(reviewed.exports[source] ?? [])].sort();
	assert(
		JSON.stringify(actual) === JSON.stringify(expected),
		`${source} runtime integration surface changed. Review additions/removals in tests/upstream-motion/reviewed-exports.json. Observed: ${actual.join(', ')}`
	);
}

// Validate type-only imports against the actual package-root declaration exports.
const declarations = Object.fromEntries(
	Object.entries(packages)
		.filter(([name]) => ['motion', 'motion-dom', 'motion-utils'].includes(name))
		.map(([name, pkg]) => [name, resolve(pkg.directory, pkg.exports?.['.']?.types ?? pkg.types)])
);
const program = ts.createProgram(Object.values(declarations), {
	module: ts.ModuleKind.NodeNext,
	moduleResolution: ts.ModuleResolutionKind.NodeNext,
	skipLibCheck: true,
	noEmit: true
});
const checker = program.getTypeChecker();
const declared = new Map(
	Object.entries(declarations).map(([name, file]) => {
		const source = program.getSourceFile(file);
		const symbol = source && checker.getSymbolAtLocation(source);
		return [
			name,
			new Set(symbol ? checker.getExportsOfModule(symbol).map((entry) => entry.name) : [])
		];
	})
);
for (const { source, name, label } of typeImports)
	assert(
		declared.get(source)?.has(name),
		`${label}: ${source} no longer declares type/value ${name}`
	);

if (errors.length) {
	console.error(`Motion upgrade gate FAILED:\n${errors.map((error) => `- ${error}`).join('\n')}`);
	process.exitCode = 1;
} else {
	console.log(
		JSON.stringify(
			{
				status: 'passed',
				versions: Object.fromEntries(
					Object.entries(packages).map(([name, pkg]) => [name, pkg.version])
				),
				runtimeImports: Object.fromEntries(
					[...observed].map(([name, imports]) => [name, imports.size])
				),
				checkedTypeImports: typeImports.length,
				checkedSourceFiles: sources.length,
				next: 'Run tests/upstream-motion/playwright.config.ts and the existing adapter/consumer qualification suites. Export existence is not behavioral compatibility.'
			},
			null,
			2
		)
	);
}
