import type { PrismaClient } from '@prisma/client';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: import('lucia').AuthRequest;
		}
		// interface PageData {}
		// interface Platform {}
	}

	//cooking
	declare namespace svelteHTML {
        interface HTMLAttributes<T> {
            'on:click_outside'?: CompositionEventHandler<T>;
        }
    }
	
	var __prisma: PrismaClient;

	/// <reference types="lucia" />
	namespace Lucia {
		type Auth = import('$lib/server/lucia').Auth;
		type DatabaseUserAttributes = {
			username: string;
			name: string;
			account_id: number;
			createdDate: Date;
			profile_url?: string;
			avatar_url?: string;
			account_id: number;
			steam_id?: BigInt;
			roles?: string;

		};
		type DatabaseSessionAttributes = {};
	}

	interface Locals {
		validate: import('lucia/sveltekit').Validate;
		validateUser: import('lucia/sveltekit').ValidateUser;
		setSession: import('lucia/sveltekit').SetSession;
		auth: import('lucia').AuthRequest;
	}

	interface Match {
		id: number;
		match_id: bigint;
		account_id: number;
		assists: number;
		average_rank?: number | null;
		deaths: number;
		duration: number;
		game_mode: number;
		hero_id: number;
		kills: number;
		leaver_status?: number;
		lobby_type?: number;
		party_size?: number | null;
		player_slot: number;
		radiant_win: boolean;
		skill?: number | null;
		start_time: bigint | Date;
		version?: number | null;
	}

	interface MatchStats {
		playerID: number;
		playerName: string;
		matchData: any;
		dataSource: any;
		od_url: any;
	}

	interface SortObj {
		headerText: string;
		headerKey: string;
		index: number;
	}

	interface SortBy {
		sortObj: SortObj;
		ascending: boolean;
	}

	type Categories = 'sveltekit' | 'svelte';

	type Post = {
		title: string;
		slug: string;
		description: string;
		date: string;
		categories: Categories[];
		published: boolean;
	};
}

export {};
