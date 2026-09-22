import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { inspectConsumerDependencies } from './motion-consumer-dependencies.mjs';

const setupPath = process.argv[2];
if (!setupPath)
	throw new Error(
		'Pass the qualification.json path for an independently installed packed consumer.'
	);
const setup = JSON.parse(readFileSync(setupPath, 'utf8'));
const output = resolve(process.argv[3] ?? 'artifacts/consumer-strict-types.json');
const result = spawnSync('pnpm', ['run', 'check:declarations'], {
	cwd: setup.consumer,
	encoding: 'utf8'
});
const report = {
	archive: setup.archive,
	sha256: setup.sha256,
	consumer: setup.consumer,
	dependencies: inspectConsumerDependencies(setup.consumer),
	status: result.status === 0 ? 'passed' : 'failed',
	exitCode: result.status,
	stdout: result.stdout,
	stderr: result.stderr,
	error: result.error?.message
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, '\t') + '\n');
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');
console.log(`Strict declaration report: ${output}`);
process.exitCode = result.status ?? 1;
