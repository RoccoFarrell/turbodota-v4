/**
 * Pure formatting helpers for time durations and relative timestamps.
 */

/** Format seconds into a human-readable duration string (e.g. "5s", "2m 30s", "1h 15m"). */
export function formatDuration(sec: number): string {
	if (sec < 60) return `${Math.round(sec)}s`;
	const m = Math.floor(sec / 60);
	const s = Math.round(sec % 60);
	if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
	const h = Math.floor(m / 60);
	const rm = m % 60;
	return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

/** Format an ISO date string as a relative "time ago" label. */
export function timeAgo(isoDate: string, now: number = Date.now()): string {
	const diff = (now - new Date(isoDate).getTime()) / 1000;
	if (diff < 60) return 'just now';
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	return `${Math.floor(diff / 86400)}d ago`;
}
