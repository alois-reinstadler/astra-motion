import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { verifyConsumerDependencies } from './motion-consumer-dependencies.mjs';
import { stampConsumer } from './motion-consumer-provenance.mjs';

// Both apps have independent node_modules; neither aliases repository source.
const root = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const option = (name, fallback) =>
	args.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const selected = option('consumer', 'both');
if (!['plain', 'kit', 'both'].includes(selected))
	throw new Error('Expected --consumer=plain|kit|both');
const directory = mkdtempSync(join(tmpdir(), 'astra-motion-production-'));
const consumer = join(directory, 'consumer');
const plainConsumer = join(directory, 'plain-consumer');
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
function run(args, cwd) {
	const result = spawnSync('pnpm', args, { cwd, stdio: 'inherit' });
	if (result.status !== 0) throw new Error(`pnpm ${args.join(' ')} failed (${result.status})`);
}
run(['pack', '--pack-destination', directory], root);
const archive = join(
	directory,
	`${manifest.name.replace(/^@/, '').replaceAll('/', '-')}-${manifest.version}.tgz`
);
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const info = {
	archive,
	sha256: createHash('sha256').update(readFileSync(archive)).digest('hex'),
	...(selected !== 'plain' ? { consumer } : {}),
	...(selected !== 'kit' ? { plainConsumer } : {}),
	source: {
		commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
		dirty:
			execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim() !== ''
	},
	dependencyGraphs: { library: sha256(join(root, 'pnpm-lock.yaml')) },
	created: new Date().toISOString()
};
const setupPath = option('output', '/tmp/astra-motion-production-current.json');
writeFileSync(join(directory, 'qualification.json'), JSON.stringify(info, null, 2) + '\n');
// Keep provenance even when a check discovers a real packaging failure.
writeFileSync(setupPath, JSON.stringify(info, null, 2) + '\n');
for (const [name, target] of [
	['plain-consumer', info.plainConsumer],
	['consumer', info.consumer]
]) {
	if (!target) continue;
	cpSync(join(root, 'tests/production', name), target, { recursive: true });
	if (name === 'consumer')
		renameSync(join(target, 'vite.config.ts.fixture'), join(target, 'vite.config.ts'));
	cpSync(archive, join(target, 'astra-motion.tgz'));
	writeFileSync(join(target, '.npmrc'), 'auto-install-peers=false\n');
	run(['install'], target);
	info.dependencyGraphs[name] = sha256(join(target, 'pnpm-lock.yaml'));
	cpSync(join(target, 'pnpm-lock.yaml'), join(directory, `${name}-pnpm-lock.yaml`));
	writeFileSync(join(directory, 'qualification.json'), JSON.stringify(info, null, 2) + '\n');
	writeFileSync(setupPath, JSON.stringify(info, null, 2) + '\n');
	console.log(
		JSON.stringify({ consumer: name, dependencies: verifyConsumerDependencies(target) }, null, 2)
	);
	const brokenRoot = join(directory, `${name}-missing-forwarding.svelte`);
	const forwardedRoot = join(directory, `${name}-forwarded.svelte`);
	writeFileSync(brokenRoot, '<button>Missing</button>');
	writeFileSync(
		forwardedRoot,
		'<script>let { children, ...props } = $props()</script><button {...props}>{@render children?.()}</button>'
	);
	const checkMissing = spawnSync('pnpm', ['exec', 'astra-check-forwarding', brokenRoot], {
		cwd: target,
		encoding: 'utf8'
	});
	assert.equal(
		checkMissing.status,
		1,
		'Installed forwarding checker must reject missing forwarding'
	);
	assert.match(checkMissing.stderr, /attachment-forwarding/);
	run(['exec', 'astra-check-forwarding', forwardedRoot], target);
	run(['run', 'check'], target);
	run(['run', 'check:declarations'], target);
	run(['run', 'build'], target);
	if (name === 'consumer') stampConsumer(info);
}
console.log(JSON.stringify({ ...info, setupPath }, null, 2));
