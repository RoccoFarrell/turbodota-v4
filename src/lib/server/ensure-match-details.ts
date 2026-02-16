import type { PlayersMatchDetail } from '@prisma/client';
import prisma from '$lib/server/prisma';

/**
 * Fetches match details from OpenDota and upserts MatchDetail + PlayersMatchDetail.
 * Call this when you need per-player stats (last_hits, denies, net_worth, etc.) for a match.
 * @returns true if details were fetched and stored (or already existed), false on fetch failure
 */
export async function ensureMatchDetails(matchId: number): Promise<boolean> {
	const existing = await prisma.matchDetail.findUnique({
		where: { match_id: matchId }
	});
	if (existing) return true;

	const res = await fetch(`https://api.opendota.com/api/matches/${matchId}`, {
		method: 'get',
		headers: { 'Content-Type': 'application/json' }
	});
	if (!res.ok) {
		console.error(`[ensureMatchDetails] OpenDota match ${matchId} failed: ${res.status}`);
		return false;
	}

	const matchDetailsFetch = await res.json();
	const matchDetailObj = {
		match_id: matchDetailsFetch.match_id,
		radiant_win: matchDetailsFetch.radiant_win,
		duration: matchDetailsFetch.duration,
		pre_game_duration: matchDetailsFetch.pre_game_duration,
		start_time: matchDetailsFetch.start_time,
		tower_status_radiant: matchDetailsFetch.tower_status_radiant,
		tower_status_dire: matchDetailsFetch.tower_status_dire,
		barracks_status_radiant: matchDetailsFetch.barracks_status_radiant,
		barracks_status_dire: matchDetailsFetch.barracks_status_dire,
		first_blood_time: matchDetailsFetch.first_blood_time,
		patch: matchDetailsFetch.patch,
		radiant_score: matchDetailsFetch.radiant_score,
		dire_score: matchDetailsFetch.dire_score,
		average_rank: matchDetailsFetch.average_rank
	};

	const playersArr: PlayersMatchDetail[] = (matchDetailsFetch.players ?? [])
		.filter((player: { account_id?: number }) => player.account_id)
		.map((player: Record<string, unknown>) => ({
			match_id: matchDetailsFetch.match_id,
			account_id: player.account_id as number,
			player_slot: player.player_slot as number,
			hero_id: player.hero_id as number,
			item_0: (player.item_0 as number) ?? 0,
			item_1: (player.item_1 as number) ?? 0,
			item_2: (player.item_2 as number) ?? 0,
			item_3: (player.item_3 as number) ?? 0,
			item_4: (player.item_4 as number) ?? 0,
			item_5: (player.item_5 as number) ?? 0,
			backpack_0: (player.backpack_0 as number) ?? 0,
			backpack_1: (player.backpack_1 as number) ?? 0,
			backpack_2: (player.backpack_2 as number) ?? 0,
			item_neutral: (player.item_neutral as number) ?? 0,
			kills: (player.kills as number) ?? 0,
			deaths: (player.deaths as number) ?? 0,
			assists: (player.assists as number) ?? 0,
			last_hits: (player.last_hits as number) ?? 0,
			denies: (player.denies as number) ?? 0,
			gold_per_min: (player.gold_per_min as number) ?? 0,
			xp_per_min: (player.xp_per_min as number) ?? 0,
			level: (player.level as number) ?? 0,
			net_worth: (player.net_worth as number) ?? 0,
			aghanims_scepter: (player.aghanims_scepter as number) ?? 0,
			aghanims_shard: (player.aghanims_shard as number) ?? 0,
			moonshard: (player.moonshard as number) ?? 0,
			hero_damage: (player.hero_damage as number) ?? null,
			tower_damage: (player.tower_damage as number) ?? null,
			hero_healing: (player.hero_healing as number) ?? null,
			gold: (player.gold as number) ?? null,
			gold_spent: (player.gold_spent as number) ?? null,
			win: !!(player.win as boolean),
			lose: !!(player.lose as boolean),
			total_gold: (player.total_gold as number) ?? 0,
			total_xp: (player.total_xp as number) ?? 0,
			kda: (player.kda as number) ?? 0,
			benchmarks: typeof player.benchmarks === 'string' ? player.benchmarks : JSON.stringify(player.benchmarks ?? {})
		}));

	try {
		await prisma.$transaction(async (tx) => {
			await tx.matchDetail.upsert({
				where: { match_id: matchDetailsFetch.match_id },
				update: { ...matchDetailObj },
				create: { ...matchDetailObj }
			});
			await Promise.all(
				playersArr.map((player) =>
					tx.playersMatchDetail.upsert({
						where: {
							matchPlusAccount: { match_id: matchId, account_id: player.account_id }
						},
						update: { ...player },
						create: { ...player }
					})
				)
			);
		});
		return true;
	} catch (e) {
		console.error(`[ensureMatchDetails] write failed for match ${matchId}:`, e);
		return false;
	}
}
