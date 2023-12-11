<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';

	//page data
	export let data: PageData;

	//helpers
	import winOrLoss from '$lib/helpers/winOrLoss';
	import { playersWeCareAbout } from '$lib/constants/playersWeCareAbout';
    import turboking from '$lib/assets/turboking.png';

	//stores
	import { sortData } from '$lib/stores/sortData';

	//hero list
	let heroListWithAll = data.streamed.heroDescriptions.allHeroes.sort((a: any, b: any) => {
		if (a.localized_name < b.localized_name) return -1;
		else return 1;
	});

	heroListWithAll = [
		{
			id: -1,
			localized_name: 'All',
			roles: []
		},
		...data.streamed.heroDescriptions.allHeroes
	];

	const heroList: Hero[] = heroListWithAll;

	class PlayerStats {
		playerID: number = 0;
		name: string = '';
		games: number = 0;
		wins: number = 0;
		losses: number = 0;
		win_percentage: number = 0;
		kda: number = 0;
		kills: number = 0;
		deaths: number = 0;
		assists: number = 0;
	}

    let overallMaxWinRate: PlayerStats = new PlayerStats();
	let overallMinWinRate: PlayerStats = new PlayerStats();

	//helper functions

	let matchStats: MatchStats[] = [];
	data.streamed.matchStats.then((value) => {
		//console.log(`promise finished ${value}`);
		matchStats = value;
		loadAccolades();
	});
	const loadAccolades = () => {
		//console.log(matchStats);
		let playerData: PlayerStats[] = [];
		let playerData2: PlayerStats[] = [];
        let playerData3: PlayerStats[] = [];

		matchStats.forEach((player) => {
			let playerIndex: number = matchStats.indexOf(player);
			heroListWithAll.forEach((hero: Hero) => {
				//filters match data for selected player
				let pushObj:PlayerStats = new PlayerStats();

				let startDateUnix = $sortData.startDate === '' ? new Date(0) : new Date($sortData.startDate);
				let endDateUnix = new Date($sortData.endDate);
				let filteredMatchData = [];

				filteredMatchData = matchStats[playerIndex].matchData.filter((match: Match) => match.hero_id === hero.id);

                pushObj.playerID = player.playerID;
				pushObj.name = hero.localized_name;
				pushObj.games = filteredMatchData.length;
				pushObj.wins = filteredMatchData.reduce(
					(acc: number, cur: Match) => acc + (winOrLoss(cur.player_slot, cur.radiant_win) ? 1 : 0),
					0
				);
				pushObj.losses = filteredMatchData.length - pushObj.wins;
				pushObj.win_percentage = pushObj.wins / filteredMatchData.length || 0;
				pushObj.kills = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.kills, 0);
				pushObj.deaths = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.deaths, 0);
				pushObj.assists = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.assists, 0);
				pushObj.kda = (pushObj.kills + pushObj.assists) / pushObj.deaths || 0;
				playerData.push(pushObj);
			});
			
			let newArray = playerData.filter(function (element) {
				return element.games >= 20;
			});
			
			let max = newArray.reduce(function (prev, curr) {
				return prev.win_percentage > curr.win_percentage ? prev : curr;
			});

			let min = newArray.reduce(function (prev, curr) {
				return prev.win_percentage < curr.win_percentage ? prev : curr;
			});

			playerData2[playerIndex] = max;
            playerData3[playerIndex] = min
			playerData = [];
		});

		overallMaxWinRate = playerData2.reduce(function (prev, curr) {
			return prev.win_percentage > curr.win_percentage ? prev : curr;
		});

        overallMinWinRate = playerData3.reduce(function (prev, curr) {
			return prev.win_percentage < curr.win_percentage ? prev : curr;
		});

		console.log(overallMaxWinRate);
        console.log(overallMinWinRate);
	};
    
</script>

<a class="card flex overflow-hidden w-6/12" href="/">
    <header>
        <img src={turboking} class="bg-black/50 w-32" alt="Post" />
    </header>
    <div class="p-4 space-y-1">
        <h6 class="h3">Highest Win Rate (Over 20 games played)</h6>
        <h3 class="h6">{overallMaxWinRate.name}</h3>
        <h3 class="h6">{playersWeCareAbout.find((element) => element.playerID === overallMaxWinRate.playerID)?.playerName}</h3>
        <article>
            <p>
                Games: {overallMaxWinRate.games}
            </p>
            <p>
                Wins: {overallMaxWinRate.wins}
            </p>
            <p>
                Losses: {overallMaxWinRate.losses}
            </p>
            <p class="animate-pulse text-amber-600 font-bold">
                Win Percentage: {overallMaxWinRate.win_percentage}
            </p>
        </article>
    </div>
</a>

<a class="card flex overflow-hidden w-6/12" href="/">
    <header>
        <img src={turboking} class="bg-black/50 w-32" alt="Post" />
    </header>
    <div class="p-4 space-y-1">
        <h6 class="h3">Lowest Win Rate (Over 20 games played)</h6>
        <h3 class="h6">{overallMinWinRate.name}</h3>
        <h3 class="h6">{playersWeCareAbout.find((element) => element.playerID === overallMinWinRate.playerID)?.playerName}</h3>
        <article>
            <p>
                Games: {overallMinWinRate.games}
            </p>
            <p>
                Wins: {overallMinWinRate.wins}
            </p>
            <p>
                Losses: {overallMinWinRate.losses}
            </p>
            <p class="text-red-800 vibrating font-bold">
                Win Percentage: {overallMinWinRate.win_percentage}
            </p>
        </article>
    </div>
</a>

<a class="card flex overflow-hidden w-6/12" href="/">
    <header>
        <img src={turboking} class="bg-black/50 w-32" alt="Post" />
    </header>
    <div class="p-4 space-y-1">
        <h6 class="h3">Player of the Week!</h6>
        <h3 class="h6">{overallMaxWinRate.name}</h3>
        <h3 class="h6">{playersWeCareAbout.find((element) => element.playerID === overallMaxWinRate.playerID)?.playerName}</h3>
        <article>
            <p>
                Games: {overallMaxWinRate.games}
            </p>
            <p>
                Wins: {overallMaxWinRate.wins}
            </p>
            <p>
                Losses: {overallMaxWinRate.losses}
            </p>
            <p class="animate-pulse text-amber-600 font-bold">
                Win Percentage: {overallMaxWinRate.win_percentage}
            </p>
        </article>
    </div>
</a>

<a class="card flex overflow-hidden w-6/12" href="/">
    <header>
        <img src={turboking} class="bg-black/50 w-32" alt="Post" />
    </header>
    <div class="p-4 space-y-1">
        <h6 class="h3">LOSER of the Week!</h6>
        <h3 class="h6">{overallMinWinRate.name}</h3>
        <h3 class="h6">{playersWeCareAbout.find((element) => element.playerID === overallMinWinRate.playerID)?.playerName}</h3>
        <article>
            <p>
                Games: {overallMinWinRate.games}
            </p>
            <p>
                Wins: {overallMinWinRate.wins}
            </p>
            <p>
                Losses: {overallMinWinRate.losses}
            </p>
            <p class = 'text-red-800 vibrating font-bold'>
                Win Percentage: {overallMinWinRate.win_percentage}
            </p>
        </article>
    </div>
</a>
