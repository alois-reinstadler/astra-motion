import { verifyConsumerDependencies } from './motion-consumer-dependencies.mjs';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export const identityPath = '/__astra-qualification.json';
export const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function verifyPackedConsumer(setup) {
	verifyConsumerDependencies(setup.consumer);
	const bytes = readFileSync(setup.archive);
	assert.equal(digest(bytes), setup.sha256, 'Archive differs from recorded SHA-256');
	assert(
		bytes.equals(readFileSync(join(setup.consumer, 'astra-motion.tgz'))),
		'Copied tarball differs'
	);
	const files = execFileSync('tar', ['-tzf', setup.archive], { encoding: 'utf8' })
		.trim()
		.split('\n');
	assert(
		files.every(
			(file) =>
				/^package\/(package\.json|README\.md|LICENSE(?:\.md)?|dist\/index\.(js|d\.ts)|dist\/motion\/.*)$/.test(
					file
				) && !file.split('/').includes('..')
		),
		'Unexpected packed files'
	);
	assert(!files.some((file) => /\.(test|spec)\./.test(file)), 'Tests leaked into tarball');
	const installed = realpathSync(join(setup.consumer, 'node_modules/astra-motion'));
	assert(
		installed.startsWith(realpathSync(setup.consumer) + '/'),
		'Installed package resolves outside isolated consumer'
	);
	for (const file of files) {
		const packed = execFileSync('tar', ['-xOzf', setup.archive, file]);
		assert(
			packed.equals(readFileSync(join(installed, file.slice('package/'.length)))),
			`Installed package differs: ${file}`
		);
	}
	const packed = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'));
	return { files, packed, bytes: bytes.length };
}

export function buildIdentity(setup) {
	const directory = join(setup.consumer, 'build');
	const assets = {};
	const server = {};
	for (const file of readdirSync(directory, { recursive: true }).sort()) {
		if (!/\.(?:m?js|css)$/.test(file)) continue;
		const hash = digest(readFileSync(join(directory, file)));
		if (file.startsWith('client/')) assets['/' + file.slice('client/'.length)] = hash;
		else server[file] = hash;
	}
	assert(
		Object.keys(assets).length > 0 && Object.keys(server).length > 0,
		'Expected built client and server files'
	);
	const contents = { archiveSha256: setup.sha256, assets, server };
	return { buildId: digest(JSON.stringify(contents)), ...contents };
}

export function stampConsumer(setup) {
	verifyPackedConsumer(setup);
	const identity = buildIdentity(setup);
	writeFileSync(
		join(setup.consumer, 'build/client', identityPath),
		JSON.stringify(identity, null, 2) + '\n'
	);
	return identity;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const setup = JSON.parse(
		readFileSync(process.argv[2] ?? '/tmp/astra-motion-production-current.json', 'utf8')
	);
	const identity = stampConsumer(setup);
	console.log(
		JSON.stringify(
			{
				buildId: identity.buildId,
				archiveSha256: identity.archiveSha256,
				clientAssets: Object.keys(identity.assets).length,
				serverFiles: Object.keys(identity.server).length,
				identityPath
			},
			null,
			2
		)
	);
}
