import MagicString from 'magic-string';
import { parse, type AST } from 'svelte/compiler';

/** Research spike only. Not installed in Vite or exported from the library. */
export function transformLayoutAttributes(source: string, filename = 'Component.svelte') {
	const ast = parse(source, { modern: true, filename });
	const identifiers = new Set<string>();
	const elements: AST.BaseElement[] = [];
	const foreign = new Set<object>();
	walk(ast, (node) => {
		if (node.type === 'Identifier' && typeof node.name === 'string') identifiers.add(node.name);
		if (node.type === 'RegularElement' && ['svg', 'math'].includes(String(node.name))) {
			walk(node, (descendant) => foreign.add(descendant));
		}
		if (Array.isArray(node.attributes) && typeof node.name === 'string') {
			elements.push(node as unknown as AST.BaseElement);
		}
	});
	const unique = (base: string) => {
		let name = base;
		while (identifiers.has(name)) name += '_';
		identifiers.add(name);
		return name;
	};
	const factory = unique('__astraCreateLayout');
	const controller = unique('__astraLayout');
	const output = new MagicString(source);
	let transformed = 0;
	for (const element of elements) {
		const metadata = element.attributes.filter(
			(attribute): attribute is AST.Attribute =>
				attribute.type === 'Attribute' && ['layout', 'layoutId'].includes(attribute.name)
		);
		if (!metadata.length) continue;
		const fail = (message: string): never => {
			throw new Error(`${filename}:${element.start}: ${message}`);
		};
		if (
			element.type !== 'RegularElement' ||
			foreign.has(element) ||
			(ast.options?.namespace && ast.options.namespace !== 'html')
		) {
			fail(
				'Layout attributes require a native HTML element; forward an explicit attachment through components.'
			);
		}
		if (element.attributes.some((attribute) => attribute.type === 'SpreadAttribute')) {
			fail(
				'Layout with spread attributes is not supported by this spike: transform ownership is ambiguous.'
			);
		}
		if (
			element.attributes.some((attribute) =>
				['TransitionDirective', 'AnimateDirective'].includes(attribute.type)
			)
		) {
			fail(
				'Layout with transition:/in:/out:/animate: requires explicit transform coordination; use the runtime API.'
			);
		}
		const properties: string[] = [];
		for (const attribute of metadata) {
			if (attribute.name === 'layout') {
				if (attribute.value !== true) {
					const value = attribute.value;
					if (
						!Array.isArray(value) ||
						value.length !== 1 ||
						value[0].type !== 'Text' ||
						!['position', 'size', 'both'].includes(value[0].data)
					) {
						fail(
							'This spike accepts bare layout or layout="position|size|both"; use an explicit attachment for reactive options.'
						);
					}
					properties.push(`mode: ${JSON.stringify((value as AST.Text[])[0].data)}`);
				}
			} else {
				const value = attribute.value;
				if (value === true) fail('layoutId requires a string or expression.');
				if (typeof value === 'object' && !Array.isArray(value)) {
					const { start, end } = position(value.expression);
					properties.push(`id: (${source.slice(start, end)})`);
				} else if (Array.isArray(value) && value.length === 1 && value[0].type === 'Text') {
					properties.push(`id: ${JSON.stringify(value[0].data)}`);
				} else {
					fail(
						'Use layoutId={expression} for dynamic IDs; mixed quoted interpolation is not supported by this spike.'
					);
				}
			}
			output.remove(attribute.start, attribute.end);
		}
		output.appendLeft(metadata[0].start, `{@attach ${controller}({${properties.join(', ')}})}`);
		transformed++;
	}
	if (transformed) {
		const declarations = `\nimport { createLayout as ${factory} } from 'astra-motion';\nconst ${controller} = ${factory}();\n`;
		if (ast.instance) output.appendLeft(position(ast.instance.content).start, declarations);
		else output.prepend(`<script>${declarations}</script>\n`);
	}
	return {
		code: output.toString(),
		map: output.generateMap({ source: filename, includeContent: true, hires: true }),
		controller: transformed ? controller : undefined,
		transformed
	};
}

/** ESTree's types omit the offsets supplied by Svelte's parser. Validate the boundary. */
function position(node: unknown): { start: number; end: number } {
	if (
		node &&
		typeof node === 'object' &&
		'start' in node &&
		'end' in node &&
		typeof node.start === 'number' &&
		typeof node.end === 'number'
	) {
		return { start: node.start, end: node.end };
	}
	throw new Error(
		'The Svelte parser did not provide source offsets; the layout transform cannot run safely.'
	);
}

/** Traverse parser-produced structures, including scripts, snippets and render expressions. */
function walk(value: unknown, visit: (node: Record<string, unknown>) => void): void {
	if (!value || typeof value !== 'object') return;
	if (Array.isArray(value)) {
		value.forEach((child) => walk(child, visit));
		return;
	}
	const node = value as Record<string, unknown>;
	visit(node);
	Object.values(node).forEach((child) => walk(child, visit));
}
