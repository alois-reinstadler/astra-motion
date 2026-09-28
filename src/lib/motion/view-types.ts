import type { AnimationPlaybackControls, TargetAndTransition, Transition } from 'motion-dom';
import type { MotionPolicy } from './policy.js';

export type ViewAnimationType = 'enter' | 'exit' | 'update' | 'share';
export type ViewAnimationDefinition =
	TargetAndTransition | ((types: string[]) => TargetAndTransition);
export interface ViewAnimationOptions extends MotionPolicy {
	name?: string;
	transition?: Transition;
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
