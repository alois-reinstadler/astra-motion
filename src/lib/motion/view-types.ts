import type {
	AnimationPlaybackControls,
	GeneratorFactory,
	ValueKeyframesDefinition,
	ValueTransition
} from 'motion-dom';
import type { MotionPolicy } from './policy.js';

export type ViewAnimationType = 'enter' | 'exit' | 'update' | 'share';
/** Snapshot layers accept native CSS keyframes, not Motion element aliases or SVG attributes. */
type ViewStyleKey = Exclude<
	{
		[K in keyof CSSStyleDeclaration]: CSSStyleDeclaration[K] extends string ? K : never;
	}[keyof CSSStyleDeclaration],
	'cssText' | 'transition' | 'x' | 'y' | 'z' | 'rotate' | 'scale'
>;
export type ViewValueTransition = Pick<
	ValueTransition,
	| 'duration'
	| 'delay'
	| 'ease'
	| 'times'
	| 'stiffness'
	| 'damping'
	| 'mass'
	| 'velocity'
	| 'bounce'
	| 'visualDuration'
	| 'restSpeed'
	| 'restDelta'
	| 'repeat'
	| 'autoplay'
> & { type?: GeneratorFactory; repeatType?: 'loop' | 'reverse' };
export type ViewTransition = ViewValueTransition & {
	[K in ViewStyleKey | `--${string}` | 'layout' | 'default']?: ViewValueTransition;
};
export type ViewAnimationTarget = {
	[K in ViewStyleKey | `--${string}`]?: ValueKeyframesDefinition;
} & {
	transition?: ViewTransition;
	transitionEnd?: never;
	x?: never;
	y?: never;
	z?: never;
	scale?: never;
	rotate?: never;
};
export type ViewAnimationDefinition =
	ViewAnimationTarget | ((types: string[]) => ViewAnimationTarget);
export interface ViewAnimationOptions extends MotionPolicy {
	name?: string;
	transition?: ViewTransition;
	enter?: ViewAnimationDefinition;
	exit?: ViewAnimationDefinition;
	update?: ViewAnimationDefinition;
	share?: ViewAnimationDefinition;
	nonce?: string;
	onAnimationStart?: (animation: AnimationPlaybackControls, type: ViewAnimationType) => void;
	onAnimationComplete?: (type: ViewAnimationType) => void;
}

export interface ViewUpdateContext {
	/** Cancellation interrupts capture/animation; cooperative async updates may also inspect this signal. */
	readonly signal: AbortSignal;
	addType(type: string): void;
}
export type ViewUpdate = (context: ViewUpdateContext) => void | Promise<void>;
export interface ViewTransitionOptions extends MotionPolicy {
	types?: readonly string[];
	/** Queue coalesces pending updates without dropping callbacks; replace releases the older capture before the next one owns its names. */
	policy?: 'queue' | 'replace';
	document?: Document;
	/** Supplies CSP authorization when the first entering view has no previous boundary. */
	nonce?: string;
	onDiagnostic?: (message: string) => void;
}
export type ViewTransitionOutcome = 'finished' | 'skipped' | 'unsupported';
export interface ViewTransitionHandle {
	readonly ready: Promise<void>;
	readonly updateCallbackDone: Promise<void>;
	readonly finished: Promise<ViewTransitionOutcome>;
	readonly types: readonly string[];
	/** Like the native method, skips animation while still applying the state update once. */
	skipTransition(): void;
	cancel(): void;
}
