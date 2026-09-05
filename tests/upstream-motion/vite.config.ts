import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Deliberately independent of the application's SvelteKit/Vite configuration.
export default defineConfig({
	root: fileURLToPath(new URL('.', import.meta.url)),
	server: {
		host: '127.0.0.1',
		port: 5194,
		strictPort: true,
		fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] }
	}
});
