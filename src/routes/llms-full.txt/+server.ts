import { base } from '$app/paths';
import { fullReference } from '$lib/server/reference.js';
export const prerender = true;
export const GET = () =>
	new Response(fullReference(base), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
