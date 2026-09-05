export function load({ url }: { url: URL }) {
	const count = Number(url.searchParams.get('count') ?? 100);
	const requested = url.searchParams.get('mode');
	const mode: 'automatic' | 'explicit' | 'instant' =
		requested === 'explicit' || requested === 'instant' ? requested : 'automatic';
	return { count: [1, 10, 100, 500].includes(count) ? count : 100, mode };
}
