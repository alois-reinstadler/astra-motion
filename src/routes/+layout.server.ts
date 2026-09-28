import * as environment from '$env/static/public';
import { base } from '$app/paths';
import { pageMetadata, siteOrigin, canonicalPathname } from '$lib/site/seo.js';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = ({ url }) => ({
	seo: {
		pathname: url.pathname,
		canonicalPathname: base + canonicalPathname(url.pathname.slice(base.length) || '/'),
		metadata: pageMetadata(url.pathname.slice(base.length) || '/'),
		origin: siteOrigin(Reflect.get(environment, 'PUBLIC_SITE_URL'))
	}
});
