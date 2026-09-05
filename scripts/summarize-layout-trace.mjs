import { readFileSync, writeFileSync } from 'node:fs';
const source = process.argv[2];
const destination = process.argv[3];
if (!source || !destination) throw new Error('Pass input trace and output summary paths.');
const events = JSON.parse(readFileSync(source, 'utf8')).traceEvents;
const marks = events.filter((event) => event.name?.startsWith('profile-'));
const names = new Map(
	events
		.filter((event) => event.name === 'thread_name')
		.map((event) => [`${event.pid}:${event.tid}`, event.args.name])
);
const rows = [];
for (let iteration = 0; iteration < 3; iteration++) {
	const start = marks.find((event) => event.name === `profile-${iteration}-start`);
	const end = marks.find((event) => event.name === `profile-${iteration}-end`);
	const transactionEnd = marks.find(
		(event) => event.name === `profile-${iteration}-transaction-end`
	);
	const window = events.filter(
		(event) => event.ph === 'X' && event.dur && event.ts >= start.ts && event.ts < end.ts
	);
	const groups = new Map();
	for (const event of window) {
		const thread = names.get(`${event.pid}:${event.tid}`) ?? `${event.pid}:${event.tid}`;
		const key = `${thread}:${event.name}`;
		let group = groups.get(key);
		if (!group)
			groups.set(key, (group = { thread, name: event.name, count: 0, totalMs: 0, maxMs: 0 }));
		group.count++;
		group.totalMs += event.dur / 1000;
		group.maxMs = Math.max(group.maxMs, event.dur / 1000);
	}
	rows.push({
		iteration,
		transactionMs: (transactionEnd.ts - start.ts) / 1000,
		durationMs: (end.ts - start.ts) / 1000,
		// Inclusive durations overlap; categories must not be added together.
		mainEvents: [...groups.values()]
			.filter((group) => group.thread === 'CrRendererMain')
			.sort((a, b) => b.totalMs - a.totalMs)
			.slice(0, 25),
		otherEvents: [...groups.values()]
			.filter((group) => group.thread !== 'CrRendererMain')
			.sort((a, b) => b.totalMs - a.totalMs)
			.slice(0, 15),
		longestMain: window
			.filter((event) => event.pid === start.pid && event.tid === start.tid)
			.sort((a, b) => b.dur - a.dur)
			.slice(0, 10)
			.map((event) => ({
				name: event.name,
				offsetMs: (event.ts - start.ts) / 1000,
				durationMs: event.dur / 1000,
				threadCpuMs: (event.tdur ?? 0) / 1000,
				args: event.args
			}))
	});
}
const summary = {
	source,
	eventCount: events.length,
	notes:
		'Inclusive event durations overlap and are not additive. Trace capture itself adds overhead. Main/thread classification comes from Chromium trace metadata.',
	rows
};
writeFileSync(destination, JSON.stringify(summary, null, 2));
for (const row of rows)
	console.log(
		JSON.stringify({
			iteration: row.iteration,
			transactionMs: row.transactionMs,
			main: row.mainEvents.slice(0, 12),
			other: row.otherEvents.slice(0, 4)
		})
	);
