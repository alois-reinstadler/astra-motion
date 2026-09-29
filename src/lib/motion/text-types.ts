import type { HTMLAttributes } from 'svelte/elements';
import type { InViewOptions } from './in-view.svelte.js';

export type TextEffect = 'fade' | 'slide' | 'blur';
export type TextSplit = 'whole' | 'words' | 'graphemes';
export type TextDirection = 'up' | 'down' | 'left' | 'right';
export type TextHost = 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export interface TextMotionOptions {
	effect?: TextEffect;
	split?: TextSplit;
	/** Seconds between fragments; independent of the effect. */
	stagger?: number;
	direction?: TextDirection;
	distance?: number;
	/** Seconds. Defaults to inherited transition duration, then 0.3. */
	duration?: number;
	/** Explicit segmentation locale; defaults to en on every platform. */
	locale?: string;
}
export type TextBaseProps = Omit<HTMLAttributes<HTMLElement>, 'children'> &
	TextMotionOptions & {
		text: string;
		as?: TextHost;
	};
export type TextRevealProps = TextBaseProps & {
	trigger?: 'mount' | 'viewport' | 'state';
	visible?: boolean;
	once?: boolean;
	viewport?: Omit<InViewOptions, 'initial' | 'once'>;
};
export type TextSwapProps = TextBaseProps & {
	mode?: 'sync' | 'wait';
	size?: 'content' | 'reserve' | 'fixed';
	alternatives?: readonly string[];
	overflow?: 'clip' | 'visible';
	live?: 'off' | 'polite' | 'assertive';
};
