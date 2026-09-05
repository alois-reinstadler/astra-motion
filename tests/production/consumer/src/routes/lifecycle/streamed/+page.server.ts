import type { PageServerLoad } from './$types';
export const load: PageServerLoad = ({ url }) => ({
	mode: url.searchParams.get('mode') === 'reserved' ? 'reserved' : 'late',
	photo: new Promise<{ title: string; stamp: number }>((resolve) => {
		setTimeout(() => resolve({ title: 'Late photograph arrived', stamp: Date.now() }), 900);
	})
});
