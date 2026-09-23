import { cpSync, mkdtempSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const evidenceRoot = import.meta.dirname;
const repository = resolve(evidenceRoot, '../../..');
const output = mkdtempSync(join(tmpdir(), 'astra-ergonomics-repro-'));
const consumer = join(output, 'consumer');
function run(args, cwd) {
	const result = spawnSync('pnpm', args, { cwd, stdio: 'inherit' });
	if (result.status !== 0) throw new Error(`pnpm ${args.join(' ')} failed (${result.status})`);
}
cpSync(join(evidenceRoot, 'consumer'), consumer, { recursive: true });
renameSync(join(consumer, 'vite.config.ts.fixture'), join(consumer, 'vite.config.ts'));
run(['pack', '--pack-destination', output], repository);
// This specimen deliberately targets the reviewed 0.0.1 manifest.
cpSync(join(output, 'astra-motion-0.0.1.tgz'), join(consumer, 'astra-motion.tgz'));
run(['install'], consumer);
run(['run', 'check'], consumer);
run(['run', 'build'], consumer);
console.log(`Consumer: ${consumer}`);
