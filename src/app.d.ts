import type { PrismaClient } from '@prisma/client'

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: import('lucia').AuthRequest
		}
		// interface PageData {}
		// interface Platform {}
	}
	var __prisma: PrismaClient

	/// <reference types="lucia" />
	declare global {
		namespace Lucia {
			type Auth = import("$lib/server/lucia").Auth;
			type DatabaseUserAttributes = {
				username: string
				name: string
			};
			type DatabaseSessionAttributes = {};
		}
	}

	interface Locals {
        validate: import('lucia/sveltekit').Validate;
        validateUser: import('lucia/sveltekit').ValidateUser;
        setSession: import('lucia/sveltekit').SetSession;
        auth: import('lucia').AuthRequest;
    }

	interface Match {
		id: Int
		match_id: bigint
		account_id: bigint
		assists: number
		average_rank?: number | null
		deaths: number
		duration: number
		game_mode: number
		hero_id: number
		kills: number
		leaver_status: number
		lobby_type: number
		party_size?: number | null
		player_slot: number
		radiant_win: boolean
		skill?: number | null
		start_time: bigint
		version?: number | null
	}

	interface MatchStats {
		playerID: number;
		playerName: string;
		matchData: any;
		dataSource: any;
		od_url: any;
	}

	interface Hero{
		id: number
		name: string
		localized_name: string
		primary_attr: string
		attack_type: string
		roles: string
		legs: Int
	}
	
}

export { }
