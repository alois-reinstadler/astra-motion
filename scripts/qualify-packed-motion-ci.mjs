import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve(import.meta.dirname, '..');
const setupFile = resolve(process.argv[2] ?? '/tmp/astra-motion-production-current.json');
const output = resolve(process.argv[3] ?? 'artifacts/packed-consumer');
const setup = JSON.parse(readFileSync(setupFile, 'utf8'));
const consumerKind =
	process.argv
		.find((argument) => argument.startsWith('--consumer='))
		?.slice('--consumer='.length) ?? 'both';
assert(['both', 'plain', 'kit'].includes(consumerKind), 'Expected --consumer=both|plain|kit');
assert(consumerKind === 'kit' || setup.plainConsumer, 'Prepare the plain consumer first');
assert(consumerKind === 'plain' || setup.consumer, 'Prepare the Kit consumer first');
mkdirSync(output, { recursive: true });
function run(script, args) {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [join(root, 'scripts', script), ...args], {
			cwd: root,
			env: process.env,
			stdio: 'inherit'
		});
		child.once('error', reject);
		child.once('exit', (code, signal) =>
			code === 0 ? resolve() : reject(new Error(`${script} failed (${code ?? signal})`))
		);
	});
}
const focusedFixture = process.argv.find((argument) => argument.startsWith('--fixture='));
assert(!focusedFixture || consumerKind === 'plain', '--fixture requires --consumer=plain');
if (consumerKind !== 'kit')
	await run('qualify-packed-motion-runtime.mjs', [
		setupFile,
		output,
		...(focusedFixture ? [focusedFixture] : [])
	]);
if (consumerKind === 'plain') process.exit(0);
// Test infrastructure selects an available loopback port; no preview allocation or public listener.
const reservation = createServer();
await new Promise((resolve, reject) => {
	reservation.once('error', reject);
	reservation.listen(0, '127.0.0.1', resolve);
});
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const logFile = join(output, 'kit-server.log');
const log = openSync(logFile, 'w');
const server = spawn(process.execPath, ['build/index.js'], {
	cwd: setup.consumer,
	env: {
		...process.env,
		HOST: '127.0.0.1',
		PORT: String(port),
		ORIGIN: `http://127.0.0.1:${port}`
	},
	stdio: ['ignore', log, log]
});
closeSync(log);
let spawnError;
server.once('error', (error) => {
	spawnError = error;
});
const closed = new Promise((resolve) => {
	server.once('exit', resolve);
	server.once('error', resolve);
});
try {
	let ready = false;
	for (let attempt = 0; attempt < 100; attempt++) {
		if (spawnError) throw spawnError;
		assert(
			server.exitCode === null && server.signalCode === null,
			`Kit consumer exited before readiness; read ${logFile}`
		);
		try {
			ready = (
				await fetch(`http://127.0.0.1:${port}/__astra-qualification.json`, {
					signal: AbortSignal.timeout(1000)
				})
			).ok;
		} catch {
			/* Startup has not bound its socket yet. */
		}
		if (ready) break;
		await delay(100);
	}
	assert(ready, `Kit consumer did not become ready; read ${logFile}`);
	await run('qualify-motion-package.mjs', [
		setupFile,
		`http://127.0.0.1:${port}`,
		join(output, `kit-results-${process.env.MOTION_BROWSER ?? 'all'}.json`)
	]);
} finally {
	if (server.exitCode === null && server.signalCode === null) {
		server.kill('SIGTERM');
		await Promise.race([closed, delay(5000, undefined, { ref: false })]);
		if (server.exitCode === null && server.signalCode === null) server.kill('SIGKILL');
		await closed;
	}
}
