/** Qualification targets an already running server at its root, never a guessed port. */
export function qualificationOrigin(value, label) {
	const message = `${label} must be an explicit HTTP(S) origin, e.g. http://127.0.0.1:<allocated-port> (no path, credentials, query or fragment).`;
	let url;
	try {
		url = new URL(value);
	} catch {
		throw new Error(message);
	}
	if (
		!['http:', 'https:'].includes(url.protocol) ||
		url.username ||
		url.password ||
		url.pathname !== '/' ||
		url.search ||
		url.hash
	)
		throw new Error(message);
	return url.origin;
}
