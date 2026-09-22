import * as environment from '$env/static/public';
import { robots, siteOrigin } from '$lib/site/seo.js';

export const prerender = true;
export const GET = () =>
	new Response(robots(siteOrigin(Reflect.get(environment, 'PUBLIC_SITE_URL'))), {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
