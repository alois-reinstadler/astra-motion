import * as environment from '$env/static/public';
import { pageMetadata, siteOrigin } from '$lib/site/seo.js';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = ({ url }) => ({
	seo: {
		pathname: url.pathname,
		metadata: pageMetadata(url.pathname),
		origin: siteOrigin(Reflect.get(environment, 'PUBLIC_SITE_URL'))
	}
});
