import { asset } from '$app/paths';

/** Local NASA photographs. Fieldwork's titles are editorial labels; original records below. */
export interface Photo {
	id: string;
	title: string;
	location: string;
	src: string;
	alt: string;
	color: string;
	category: 'Land' | 'Water';
	note: string;
	source: string;
}
export const photos: Photo[] = [
	{
		id: 'namib',
		title: 'A quiet immensity',
		location: 'Namib Desert · Namibia',
		src: asset('/showcase/namib.jpg'),
		alt: 'Rust-coloured parallel dunes stretching across the Namib Desert, photographed from orbit.',
		color: '#cc7950',
		category: 'Land',
		note: 'Wind gives the desert its handwriting. Long ridges gather into a landscape that feels almost drawn.',
		source: 'https://images.nasa.gov/details/iss073e0511487'
	},
	{
		id: 'urmia',
		title: 'The edge of stillness',
		location: 'Lake Urmia · Iran',
		src: asset('/showcase/urmia.jpg'),
		alt: 'Pale green water meeting the softly patterned western shoreline of Lake Urmia.',
		color: '#b6c2ac',
		category: 'Water',
		note: 'A shoreline is a conversation between land and water. Here, the boundary becomes the whole picture.',
		source: 'https://images.nasa.gov/details/iss044e002419'
	},
	{
		id: 'caicos',
		title: 'An impossible blue',
		location: 'Caicos Bank · Atlantic Ocean',
		src: asset('/showcase/caicos.jpg'),
		alt: 'Turquoise shallows of Caicos Bank surrounded by dark ocean, photographed from the space shuttle.',
		color: '#4d9daf',
		category: 'Water',
		note: 'Shallow water writes in turquoise. Beyond the bank, the Atlantic drops into a much deeper blue.',
		source: 'https://images.nasa.gov/details/STS100-708-078'
	},
	{
		id: 'lena',
		title: 'Every river returns',
		location: 'Lena Delta · Russia',
		src: asset('/showcase/lena.jpg'),
		alt: 'False-colour satellite image of branching Lena River channels in lime green and deep violet.',
		color: '#a4b765',
		category: 'Land',
		note: 'A river breaks into a thousand paths. This false-colour Landsat image turns the delta into a living map.',
		source: 'https://images.nasa.gov/details/GSFC_20171208_Archive_e002160'
	}
];
