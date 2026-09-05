import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async () => {
	await new Promise((resolve) => setTimeout(resolve, 180));
	return { title: 'Awaited photograph is ready' };
};
