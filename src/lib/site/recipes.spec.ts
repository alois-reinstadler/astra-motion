import { expect, it } from 'vitest';
import { compile } from 'svelte/compiler';
import { getDoc } from './docs.js';
import { liveExamples } from './examples.js';
import { recipes, recipeManifest } from './recipes.js';
import { migrationRecipes } from './migrations.js';

it('ships complete canonical recipe sources, matching references and explicit dependencies', () => {
	const manifest = recipeManifest('/astra-motion');
	expect(new Set(recipes.map((recipe) => recipe.id)).size).toBe(recipes.length);
	for (const recipe of manifest.recipes) {
		const example = liveExamples[recipe.example];
		expect(
			getDoc(example.guide)?.sections.some((section) => section.id === example.anchor),
			recipe.id
		).toBe(true);
		expect(recipe.preview).toBe(`/astra-motion/examples/${example.id}`);
		expect(recipe.files[0].source).toBe(example.source);
		expect([recipe.accessibility, recipe.motion, recipe.cost].every(Boolean)).toBe(true);
		expect(recipe.dependencies.some(({ specifier }) => specifier.startsWith('astra-motion'))).toBe(
			true
		);
		for (const dependency of recipe.dependencies) {
			expect(dependency.version, dependency.specifier).toBeTruthy();
			expect(dependency.specifier).not.toMatch(/^\$lib/);
		}
		for (const file of recipe.files) {
			for (const generate of ['client', 'server'] as const)
				expect(compile(file.source, { generate, filename: file.filename }).warnings).toEqual([]);
		}
	}
});

it('covers five concrete migration intents without duplicating example ownership', () => {
	expect(migrationRecipes.map(({ id }) => id)).toEqual([
		'enter-exit',
		'responsive-layout',
		'controlled-reorder',
		'native-elements',
		'motion-policy'
	]);
	for (const recipe of migrationRecipes) expect(liveExamples[recipe.example]).toBeDefined();
});
