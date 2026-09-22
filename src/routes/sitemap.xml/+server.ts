import * as environment from '$env/static/public';
import { sitemap, siteOrigin } from '$lib/site/seo.js';

export const prerender = true;
export const GET = () =>
	new Response(sitemap(siteOrigin(Reflect.get(environment, 'PUBLIC_SITE_URL'))), {
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
