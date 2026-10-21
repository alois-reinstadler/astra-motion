import { base } from '$app/paths';
import { recipeManifest } from '$lib/site/recipes.js';
export const prerender = true;
export const GET = () => Response.json(recipeManifest(base));
