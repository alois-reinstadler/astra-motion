import { json } from '@sveltejs/kit';
import { docSearchIndex } from '$lib/site/docs.js';
export const prerender = true;
export const GET = () => json(docSearchIndex);
