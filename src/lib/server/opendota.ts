/**
 * Fetch public player profile from OpenDota by account_id (no Steam login required).
 * Used when adding league members by account ID to populate display_name and avatar_url.
 * Rate limit: free tier ~60/min; consider a short delay between bulk calls.
 */
const OPENDOTA_PLAYER_URL = 'https://api.opendota.com/api/players';

export interface OpenDotaPlayerProfile {
	personaname: string | null;
	avatarfull: string | null;
	profileurl: string | null;
}

export async function fetchOpenDotaPlayerProfile(
	account_id: number
): Promise<OpenDotaPlayerProfile | null> {
	try {
		const url = `${OPENDOTA_PLAYER_URL}/${account_id}`;
		const res = await fetch(url, {
			headers: { Accept: 'application/json' }
		});
		if (!res.ok) return null;
		const data = (await res.json()) as { profile?: { personaname?: string; avatarfull?: string; profileurl?: string } };
		const profile = data?.profile;
		if (!profile) return null;
		return {
			personaname: profile.personaname ?? null,
			avatarfull: profile.avatarfull ?? null,
			profileurl: profile.profileurl ?? null
		};
	} catch (e) {
		console.error(`[opendota] fetch profile for ${account_id}:`, e);
		return null;
	}
}

/** Delay in ms between OpenDota calls when processing multiple account IDs (avoid rate limit). */
export const OPENDOTA_DELAY_MS = 500;
