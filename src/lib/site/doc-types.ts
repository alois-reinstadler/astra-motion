/** Shared content model. Examples are registered separately from page prose. */
export const documentationGroups = [
	'Animations',
	'Gestures',
	'Components',
	'Motion Values',
	'Hooks',
	'Guides'
] as const;
export type DocGroup = (typeof documentationGroups)[number];
export interface DocSection {
	id: string;
	title: string;
	text: string[];
	points?: string[];
	example?: string;
	related?: string[];
	aliases?: string[];
	code?: { label: string; source: string };
	table?: { columns: string[]; rows: string[][] };
	links?: {
		slug?: string;
		path?: '/status' | '/examples' | '/showcase' | '/motion-lab/product';
		title: string;
		detail: string;
	}[];
}
export interface DocPage {
	slug: string;
	title: string;
	group: DocGroup;
	summary: string;
	sections: DocSection[];
}
