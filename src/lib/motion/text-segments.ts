import type { TextSplit } from './text-types.js';

export interface TextSegment {
	text: string;
	/** Whitespace stays native text; each other group keeps word wrapping intact. */
	fragments: string[];
	/** Preserve punctuation attachment without disabling wrapping for whole/fallback text. */
	nowrap?: true;
}
/** A conservative whole-string fallback never corrupts Unicode sequences. */
export function segmentText(text: string, split: TextSplit, locale = 'en'): TextSegment[] {
	if (!text) return [];
	if (split === 'whole' || typeof Intl.Segmenter !== 'function')
		return [{ text, fragments: [text] }];
	const words = new Intl.Segmenter(locale, { granularity: 'word' });
	const graphemes =
		split === 'graphemes' ? new Intl.Segmenter(locale, { granularity: 'grapheme' }) : undefined;
	const groups: TextSegment[] = [];
	let opening = '';
	for (const { segment } of words.segment(text)) {
		if (/^\s+$/u.test(segment)) {
			if (opening) {
				groups.push({ text: opening, fragments: [opening], nowrap: true });
				opening = '';
			}
			groups.push({ text: segment, fragments: [] });
			continue;
		}
		if (/^[\p{Ps}\p{Pi}]+$/u.test(segment)) {
			opening += segment;
			continue;
		}
		const previous = groups.at(-1);
		if (!opening && /^\p{P}+$/u.test(segment) && previous?.fragments.length) {
			previous.text += segment;
			previous.fragments.push(
				...(graphemes ? Array.from(graphemes.segment(segment), (part) => part.segment) : [segment])
			);
			continue;
		}
		const value = opening + segment;
		opening = '';
		groups.push({
			text: value,
			fragments: graphemes ? Array.from(graphemes.segment(value), (part) => part.segment) : [value],
			nowrap: true
		});
	}
	if (opening) groups.push({ text: opening, fragments: [opening], nowrap: true });
	return groups;
}
