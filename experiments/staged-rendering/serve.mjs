import { preview } from 'vite';
const server = await preview({
	root: import.meta.dirname,
	configFile: false,
	preview: {
		host: process.env.HOST ?? '0.0.0.0',
		port: Number(process.env.PORT ?? process.env.DEV_PORT),
		strictPort: true,
		allowedHosts: ['.dev.alrein.casa']
	}
});
server.printUrls();
