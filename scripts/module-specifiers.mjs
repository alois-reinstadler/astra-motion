import ts from 'typescript';
import { parse } from 'svelte/compiler';

/** Module references only: an ordinary prop named "motion" is not a dependency. */
export function moduleSpecifiers(code, filename) {
	const found = [];
	const inspect = (script) => {
		const source = ts.createSourceFile(filename, script, ts.ScriptTarget.Latest, true);
		function visit(node) {
			let specifier;
			if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
				specifier = node.moduleSpecifier;
			else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
				specifier = node.argument.literal;
			else if (
				ts.isCallExpression(node) &&
				(node.expression.kind === ts.SyntaxKind.ImportKeyword ||
					(ts.isIdentifier(node.expression) && node.expression.text === 'require'))
			)
				specifier = node.arguments[0];
			if (specifier && ts.isStringLiteralLike(specifier)) found.push(specifier.text);
			ts.forEachChild(node, visit);
		}
		visit(source);
	};
	if (filename.endsWith('.svelte')) {
		const component = parse(code, { modern: true });
		for (const script of [component.module, component.instance]) {
			if (script) inspect(code.slice(script.content.start, script.content.end));
		}
	} else inspect(code);
	return found;
}
