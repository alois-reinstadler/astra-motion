import { recipes } from '$lib/site/recipes.js';
import { release } from '$lib/site/release.js';
export const load = () => ({ recipes, version: release.version });
