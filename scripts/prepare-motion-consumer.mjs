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
	console.log(
		JSON.stringify({ consumer: name, dependencies: verifyConsumerDependencies(target) }, null, 2)
	);
	run(['run', 'check'], target);
	run(['run', 'check:declarations'], target);
	run(['run', 'build'], target);
	if (name === 'consumer') stampConsumer(info);
}
console.log(JSON.stringify({ ...info, setupPath }, null, 2));
