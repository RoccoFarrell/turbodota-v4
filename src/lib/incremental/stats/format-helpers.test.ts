import { describe, it, expect } from 'vitest';
import { formatDuration, timeAgo } from './format-helpers';

describe('formatDuration', () => {
	it('formats seconds under a minute', () => {
		expect(formatDuration(0)).toBe('0s');
		expect(formatDuration(5)).toBe('5s');
		expect(formatDuration(59)).toBe('59s');
	});

	it('rounds fractional seconds', () => {
		expect(formatDuration(5.7)).toBe('6s');
		expect(formatDuration(30.3)).toBe('30s');
	});

	it('formats minutes and seconds', () => {
		expect(formatDuration(60)).toBe('1m');
		expect(formatDuration(90)).toBe('1m 30s');
		expect(formatDuration(125)).toBe('2m 5s');
		expect(formatDuration(3599)).toBe('59m 59s');
	});

	it('omits seconds when exactly on the minute', () => {
		expect(formatDuration(120)).toBe('2m');
		expect(formatDuration(300)).toBe('5m');
	});

	it('formats hours and minutes', () => {
		expect(formatDuration(3600)).toBe('1h');
		expect(formatDuration(3660)).toBe('1h 1m');
		expect(formatDuration(7200)).toBe('2h');
		expect(formatDuration(5400)).toBe('1h 30m');
	});
});

describe('timeAgo', () => {
	const BASE = new Date('2026-02-20T12:00:00Z').getTime();

	it('returns "just now" for < 60 seconds', () => {
		const recent = new Date(BASE - 30_000).toISOString();
		expect(timeAgo(recent, BASE)).toBe('just now');
	});

	it('returns minutes ago', () => {
		const fiveMinAgo = new Date(BASE - 5 * 60_000).toISOString();
		expect(timeAgo(fiveMinAgo, BASE)).toBe('5m ago');
	});

	it('returns hours ago', () => {
		const twoHoursAgo = new Date(BASE - 2 * 3600_000).toISOString();
		expect(timeAgo(twoHoursAgo, BASE)).toBe('2h ago');
	});

	it('returns days ago', () => {
		const threeDaysAgo = new Date(BASE - 3 * 86400_000).toISOString();
		expect(timeAgo(threeDaysAgo, BASE)).toBe('3d ago');
	});

	it('floors partial units', () => {
		const ninetySeconds = new Date(BASE - 90_000).toISOString();
		expect(timeAgo(ninetySeconds, BASE)).toBe('1m ago');
	});
});
