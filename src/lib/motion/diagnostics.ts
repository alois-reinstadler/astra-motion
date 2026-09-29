import {
	transformProps,
	getValueTransition,
	resolveTransition,
	type MotionNodeOptions,
	type MotionStyle,
	type TargetAndTransition,
	type Transition
} from 'motion-dom';
import { resolveMotionTarget } from './targets.js';

const messages = new WeakMap<object, Set<string>>();
/** Development-only, per-owner deduplication; no process-global suppression across instances. */
export function motionDiagnostic(owner: object, code: string, message: string) {
	if (process.env.NODE_ENV === 'production') return;
	let seen = messages.get(owner);
	if (!seen) messages.set(owner, (seen = new Set()));
	if (seen.has(code)) return;
	seen.add(code);
	console.warn(`Astra Motion [${code}]: ${message}`);
}

/** Only locally declared labels are checked: unresolved inherited labels are valid controllers. */
export function diagnoseMotionOptions(
	owner: object,
	options: MotionNodeOptions & { style?: MotionStyle }
) {
	if (process.env.NODE_ENV === 'production') return;
	for (const name of [
		'initial',
		'animate',
		'exit',
		'whileHover',
		'whileTap',
		'whileFocus',
		'whileInView',
		'whileDrag'
	] as const) {
		const definition = options[name];
		const labels =
			typeof definition === 'string' ? [definition] : Array.isArray(definition) ? definition : [];
		if (options.inherit === false && options.variants) {
			for (const label of labels)
				if (!(label in options.variants))
					motionDiagnostic(
						owner,
						`variant-${label}`,
						`Variant "${label}" is absent from this element's variants with inherit={false}. Define that label or correct its spelling.`
					);
		}
		if (!definition || typeof definition === 'boolean' || typeof definition === 'function')
			continue;
		// Do not execute application variant resolvers solely for an advisory diagnostic.
		if (labels.some((label) => typeof options.variants?.[label] === 'function')) continue;
		const target = resolveMotionTarget(options, definition);
		const style = options.style as Record<string, unknown> | undefined;
		const raw = target.transform ?? style?.transform;
		if (
			typeof raw === 'string' &&
			raw !== '' &&
			Object.keys(target).some((key) => transformProps.has(key))
		) {
			motionDiagnostic(
				owner,
				'raw-transform',
				'A nonempty raw transform masks independent x/y/rotate/scale targets. Clear transform with an empty string, or express the transform with independent values.'
			);
		}
	}
}

export function diagnoseInfiniteExit(
	owner: object,
	target: TargetAndTransition,
	transition?: Transition
) {
	if (process.env.NODE_ENV === 'production') return;
	// Match animateTarget: a target transition replaces the default unless it
	// explicitly inherits. Property/default overrides follow the engine's own resolver.
	const effective = target.transition
		? resolveTransition(target.transition, transition)
		: transition;
	const infinite = Object.entries(target).some(([property, value]) => {
		if (property === 'transition' || property === 'transitionEnd' || value === undefined)
			return false;
		const settings = getValueTransition(effective, property);
		return settings?.repeat === Infinity && !effective?.skipAnimations && !settings.skipAnimations;
	});
	if (infinite)
		motionDiagnostic(
			owner,
			'infinite-exit',
			'An exit with repeat: Infinity cannot complete normally. Set the exit transition repeat to 0; keep repetition on animate while present.'
		);
}

/** Compare declarative plain targets without treating equal object literals as a conflict. */
export function equivalentMotionOption(
	a: unknown,
	b: unknown,
	seen = new WeakMap<object, WeakSet<object>>()
): boolean {
	if (Object.is(a, b)) return true;
	if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
	if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
	if (!Array.isArray(a) && Object.getPrototypeOf(a) !== Object.prototype) return false;
	// Track pairs, not just the last right-hand object seen for a left object.
	// Different cycle lengths and shared subobjects can revisit one side with
	// several counterparts without being unequal or recursing forever.
	let counterparts = seen.get(a);
	if (counterparts?.has(b)) return true;
	if (!counterparts) seen.set(a, (counterparts = new WeakSet()));
	counterparts.add(b);
	const keys = Reflect.ownKeys(a),
		other = Reflect.ownKeys(b);
	return (
		keys.length === other.length &&
		keys.every(
			(key) =>
				Object.hasOwn(b, key) &&
				equivalentMotionOption(
					(a as Record<PropertyKey, unknown>)[key],
					(b as Record<PropertyKey, unknown>)[key],
					seen
				)
		)
	);
}
