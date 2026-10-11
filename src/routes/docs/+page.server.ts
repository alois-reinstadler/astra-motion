import { getDoc } from '$lib/site/docs.js';
import { prepareDocPage } from '$lib/server/doc-page.js';
export const load = () => prepareDocPage(getDoc('quick-start')!);
