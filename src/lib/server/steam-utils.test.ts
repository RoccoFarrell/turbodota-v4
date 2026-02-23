import { describe, it, expect } from 'vitest';
import { deriveAccountId, isAccountLocked } from './steam-utils';

describe('deriveAccountId', () => {
	it('converts a known Steam ID to Dota 2 account_id', () => {
		expect(deriveAccountId('76561198046984233')).toBe(86718505);
	});

	it('handles the base Steam ID (account_id 0)', () => {
		expect(deriveAccountId('76561197960265728')).toBe(0);
	});
});

describe('isAccountLocked', () => {
	it('returns true when steam_id derives to account_id', () => {
		expect(isAccountLocked({
			steam_id: 76561198046984233n,
			account_id: 86718505
		})).toBe(true);
	});

	it('returns false when steam_id is null', () => {
		expect(isAccountLocked({ steam_id: null, account_id: 86718505 })).toBe(false);
	});

	it('returns false when account_id is null', () => {
		expect(isAccountLocked({ steam_id: 76561198046984233n, account_id: null })).toBe(false);
	});

	it('returns false when steam_id does not derive to account_id', () => {
		expect(isAccountLocked({
			steam_id: 76561198046984233n,
			account_id: 99999999
		})).toBe(false);
	});
});
