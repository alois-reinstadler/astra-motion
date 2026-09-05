/** Lightweight adapter ownership; this module must not import an animation backend. */
export type MotionOwner = 'state' | 'layout' | 'timeline' | 'scroll';
type Claim = { kind: MotionOwner; token: object; count: number };
const owners = new WeakMap<Element, Claim[]>();

export function claimMotionOwnership(node: Element, kind: MotionOwner, token: object): () => void {
	const claims = owners.get(node) ?? [];
	const conflict = claims.find((claim) => {
		if (claim.token === token && claim.kind === kind) return false;
		return !(
			kind !== claim.kind &&
			['state', 'layout'].includes(kind) &&
			['state', 'layout'].includes(claim.kind)
		);
	});
	if (conflict) {
		throw new Error(
			`Astra motion: ${kind} cannot animate an element owned by ${conflict.kind}. Use the state binding's animate() for motion elements, or animate a separate child.`
		);
	}
	let claim = claims.find((entry) => entry.token === token && entry.kind === kind);
	if (claim) claim.count++;
	else {
		claim = { kind, token, count: 1 };
		claims.push(claim);
		owners.set(node, claims);
	}
	let released = false;
	return () => {
		if (released) return;
		released = true;
		if (--claim.count === 0) claims.splice(claims.indexOf(claim), 1);
		if (!claims.length) owners.delete(node);
	};
}

export function hasMotionOwnership(node: Element): boolean {
	return (owners.get(node)?.length ?? 0) > 0;
}
