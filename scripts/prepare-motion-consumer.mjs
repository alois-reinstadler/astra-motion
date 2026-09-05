import { cpSync, mkdtempSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { stampConsumer } from './motion-consumer-provenance.mjs';

// The copied app has its own node_modules and Kit output. It never aliases repo source.
const root = resolve(import.meta.dirname, '..');
const directory = mkdtempSync(join(tmpdir(), 'astra-motion-production-'));
const consumer = join(directory, 'consumer');
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
cpSync(join(root, 'tests/production/consumer'), consumer, { recursive: true });
renameSync(join(consumer, 'vite.config.ts.fixture'), join(consumer, 'vite.config.ts'));
cpSync(archive, join(consumer, 'astra-motion.tgz'));
writeFileSync(join(consumer, '.npmrc'), 'auto-install-peers=false\n');
const info = {
	archive,
	sha256: createHash('sha256').update(readFileSync(archive)).digest('hex'),
	consumer,
	created: new Date().toISOString()
};
writeFileSync(join(directory, 'qualification.json'), JSON.stringify(info, null, 2) + '\n');
// Keep the path even if a consumer check discovers a real packaging failure.
writeFileSync('/tmp/astra-motion-production-current.json', JSON.stringify(info, null, 2) + '\n');
run(['install'], consumer);
run(['run', 'check'], consumer);
run(['run', 'build'], consumer);
stampConsumer(info);
console.log(JSON.stringify(info, null, 2));
