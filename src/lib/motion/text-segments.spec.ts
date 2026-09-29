import { expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { segmentText } from './text-segments.js';
import { textPreset } from './text-presets.js';
import TextReveal from './TextReveal.svelte';
import TextSwap from './TextSwap.svelte';

it.each(['whole', 'words', 'graphemes'] as const)(
	'preserves exact Unicode and whitespace with %s',
	(split) => {
		const text = '  Hello,\t世界!\n👨‍👩‍👧‍👦 e\u0301 🇦🇹 👍🏽  ';
		expect(
			segmentText(text, split)
				.map((group) => group.text)
				.join('')
		).toBe(text);
	}
);
it('segments extended graphemes without breaking emoji, flags or combining marks', () => {
	const clusters = ['👨‍👩‍👧‍👦', 'e\u0301', '🇦🇹', '👍🏽', 'क्‍ष'];
	const fragments = segmentText(clusters.join(' '), 'graphemes').flatMap(
		(group) => group.fragments
	);
	expect(fragments).toEqual(clusters);
	expect(segmentText('', 'words')).toEqual([]);
});
it('falls back to an intact message if Intl.Segmenter is unavailable', () => {
	const original = Intl.Segmenter;
	vi.stubGlobal('Intl', { ...Intl, Segmenter: undefined });
	try {
		const text = '👨‍👩‍👧‍👦 e\u0301';
		expect(segmentText(text, 'graphemes')).toEqual([{ text, fragments: [text] }]);
	} finally {
		vi.unstubAllGlobals();
	}
	expect(Intl.Segmenter).toBe(original);
});
it('keeps effects independent from segmentation/stagger and direction', () => {
	expect(textPreset({ effect: 'fade', distance: 50 }).hidden.transform).toBe('none');
	expect(textPreset({ effect: 'slide', direction: 'left', distance: 20 }).hidden.transform).toBe(
		'translateX(20px)'
	);
	expect(textPreset({ effect: 'blur' }).hidden.filter).toBe('blur(4px)');
});
it('SSR emits visible unsplit content, complete semantics and no initial hidden styles', () => {
	const props = { text: 'Hello 👨‍👩‍👧‍👦', as: 'h2', split: 'graphemes' } as const;
	for (const html of [render(TextReveal, { props }).body, render(TextSwap, { props }).body]) {
		expect(html).toContain('<h2');
		expect(html.match(/Hello 👨‍👩‍👧‍👦/g)).toHaveLength(2);
		expect(html.match(/data-text-fragment/g)).toHaveLength(1);
		expect(html).not.toMatch(/opacity:\s*0|blur\(4px\)/);
	}
});

it('keeps opening and closing punctuation with words without swallowing language break opportunities', () => {
	expect(segmentText('(Hello, 世界。)', 'words').map((group) => group.text)).toEqual([
		'(Hello,',
		' ',
		'世界。)'
	]);
	expect(segmentText('你好世界', 'words').length).toBeGreaterThan(1);
	expect(segmentText('Whole text can wrap', 'whole')[0].nowrap).toBeUndefined();
});
