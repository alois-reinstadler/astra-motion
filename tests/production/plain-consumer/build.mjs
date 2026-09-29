import { spawnSync } from 'node:child_process';
for (const fixture of [
	'Parity',
	'Eager',
	'LazyBasic',
	'LazyFull',
	'LazySync',
	'Hybrid',
	'Mini',
	'Text',
	'Tilt'
]) {
	for (const args of [[], ['--ssr', 'src/server.ts', '--outDir', `build/${fixture}/server`]]) {
		const result = spawnSync('pnpm', ['exec', 'vite', 'build', ...args], {
			env: { ...process.env, ASTRA_FIXTURE: fixture },
			stdio: 'inherit'
		});
		if (result.status !== 0) process.exit(result.status ?? 1);
	}
}
