const STEAM_ID_BASE = 76561197960265728n;

/**
 * Derive Dota 2 account_id from a Steam 64-bit ID string.
 * Formula: account_id = steam_id - 76561197960265728
 */
export function deriveAccountId(steamId: string): number {
	return Number(BigInt(steamId) - STEAM_ID_BASE);
}

/**
 * Check if a user's account_id is locked (verified via Steam login).
 * Locked means the account_id was derived from the user's steam_id,
 * proving they own the Steam account.
 */
export function isAccountLocked(user: {
	steam_id: bigint | null;
	account_id: number | null;
}): boolean {
	if (!user.steam_id || !user.account_id) return false;
	const derived = Number(BigInt(user.steam_id) - STEAM_ID_BASE);
	return user.account_id === derived;
}
