import { readFileSync } from 'node:fs';
for (const file of process.argv.slice(2)) {
	const response = await fetch('https://mcp.svelte.dev/mcp', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'tools/call',
			params: {
				name: 'svelte-autofixer',
				arguments: { code: readFileSync(file, 'utf8'), desired_svelte_version: '5', filename: file }
			}
		})
	});
	const result = await response.text();
	console.log(file, result);
}
