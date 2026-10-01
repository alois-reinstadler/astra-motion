import packageInfo from '../../../package.json' with { type: 'json' };

/** Keep the site's evaluation guidance tied to the package being built. */
export const release = {
	version: packageInfo.version,
	label: 'Release candidate',
	archive: `astra-motion-${packageInfo.version}.tgz`
};
