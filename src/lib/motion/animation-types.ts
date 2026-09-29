import type {
	AnimationOptions,
	Transition as EngineTransition,
	TargetAndTransition as EngineTarget,
	TargetResolver as EngineResolver,
	VariantLabels
} from 'motion-dom';

/** Motion's per-animation policy override, including target and binding transitions. */
// Preserve the upstream generic default for existing Transition consumers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Transition<V = any> = EngineTransition<V> & Pick<AnimationOptions, 'reduceMotion'>;
export type TargetAndTransition = Omit<EngineTarget, 'transition'> & { transition?: Transition };
type TargetResolver = (...args: Parameters<EngineResolver>) => TargetAndTransition | string;
export type Variants = Record<string, TargetAndTransition | TargetResolver>;
export type AnimationDefinition = VariantLabels | TargetAndTransition | TargetResolver;
