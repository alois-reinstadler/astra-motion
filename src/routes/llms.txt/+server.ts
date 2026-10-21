import { base } from '$app/paths';
import { referenceIndex } from '$lib/server/reference.js';
export const prerender = true;
export const GET = () =>
	new Response(referenceIndex(base), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
