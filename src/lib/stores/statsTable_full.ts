import { writable } from 'svelte/store';

//classes and interfaces
//table data
class TableRow {
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

interface SortObj {
    headerText: string;
    headerKey: string;
    index: number;
}

interface SortBy {
    sortObj: SortObj;
    ascending: boolean;
}

let sortBy: SortBy = {
    sortObj: {
        headerText: 'Games',
        headerKey: 'games',
        index: 1
    },
    ascending: false
};

const sortMap: SortObj[] = [
    {
        headerText: 'Player',
        headerKey: 'player',
        index: 0
    },
    {
        headerText: 'Hero',
        headerKey: 'hero',
        index: 0
    },
    {
        headerText: 'Games',
        headerKey: 'games',
        index: 1
    },
    {
        headerText: 'Wins',
        headerKey: 'wins',
        index: 2
    },
    {
        headerText: 'Losses',
        headerKey: 'losses',
        index: 3
    },
    {
        headerText: 'Win %',
        headerKey: 'win_percentage',
        index: 4
    },
    {
        headerText: 'KDA',
        headerKey: 'kda',
        index: 5
    },
    {
        headerText: 'Kills',
        headerKey: 'kills',
        index: 6
    },
    {
        headerText: 'Deaths',
        headerKey: 'deaths',
        index: 7
    },
    {
        headerText: 'Assists',
        headerKey: 'assists',
        index: 8
    }
];

let selectedPlayer: string = "All"

const recalcTable = (
    selectedStartDate: Date,
    selectedEndDate: Date,
    selectedRole: string,
    selectedHeroID: number,
    selectedPlayer: string
) => {
    tableData = {
        head: ['Player', 'Games', 'Wins', 'Losses', 'Win %', 'KDA', 'Kills', 'Deaths', 'Assists'],
        body: tableMapperValues(
            recalcTableData(
                selectedStartDate,
                selectedEndDate,
                selectedRole,
                selectedHeroID,
                selectedPlayer
            ),
            ['name', 'games', 'wins', 'losses', 'win_percentage', 'kda', 'kills', 'deaths', 'assists']
        )
    };

    handleSort(sortBy);
};

const recalcTableData = (
    inputStartDate: Date,
    inputEndDate: Date,
    inputRole: string,
    inputHeroID: number,
    inputSelectedPlayer: string
) => {
    let tableData: TableRow[] = [];

    let startDateUnix = new Date(inputStartDate);
    let endDateUnix = new Date(inputEndDate);

    if (
        formatDateToString(startDateUnix) == formatDateToString(new Date(0)) &&
        formatDateToString(endDateUnix) == formatDateToString(new Date())
    ) {
        selectedStartDate = new Date(0);
        selectedEndDate = new Date();
    }

    if (inputSelectedPlayer == 'All') {
        matchStats.forEach((player) => {
            //filters match data for selected hero
            let pushObj: TableRow = new TableRow();

            let filteredMatchData = [];

            startDateUnix = new Date(inputStartDate);
            endDateUnix = new Date(inputEndDate);

            //filter reset condition
            if (inputRole == 'All' && inputHeroID == -1 && inputSelectedPlayer == 'All') {
                selectedPlayer = 'All';
                selectedHeroID = -1;
                selectedRole = 'All';
                filteredMatchData = player.matchData;
            }
            //filter by heroID
            else if (typeof inputHeroID === 'number' && inputRole == 'All') {
                selectedRole = 'All';
                selectedPlayer = 'All';
                selectedHeroID === -1
                    ? (filteredMatchData = player.matchData)
                    : (filteredMatchData = player.matchData.filter(
                            (match: Match) => match.hero_id === inputHeroID
                      ));
            }
            //filter by heroRole
            else if (typeof inputRole === 'string' && inputHeroID == -1) {
                selectedPlayer = 'All';
                selectedHeroID = -1;
                if (inputRole === 'all' || inputRole === 'All') {
                    filteredMatchData = player.matchData;
                } else {
                    let filteredHeroList = heroList
                        .filter((hero) => hero.roles.includes(inputRole))
                        .map((item) => item.id);
                    filteredMatchData = player.matchData.filter((match: Match) =>
                        filteredHeroList.includes(match.hero_id)
                    );
                }
            }

            //filter by Date
            filteredMatchData = filteredMatchData.filter(
                (match: Match) => match.start_time >= startDateUnix && match.start_time <= endDateUnix
            );

            //pushObj.playerID = player.playerID;
            pushObj.name = player.playerName;
            pushObj.games = filteredMatchData.length;
            pushObj.wins = filteredMatchData.reduce(
                (acc: number, cur: Match) => acc + (winOrLoss(cur.player_slot, cur.radiant_win) ? 1 : 0),
                0
            );
            pushObj.losses = filteredMatchData.length - pushObj.wins;
            pushObj.win_percentage = pushObj.wins / filteredMatchData.length || 0;
            pushObj.kills = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.kills, 0);
            pushObj.deaths = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.deaths, 0);
            pushObj.assists = filteredMatchData.reduce(
                (acc: number, cur: Match) => acc + cur.assists,
                0
            );
            pushObj.kda = (pushObj.kills + pushObj.assists) / pushObj.deaths || 0;

            tableData.push(pushObj);
        });

        //filter by Player
    } else {
        selectedRole = 'All';
        selectedHeroID = -1;

        heroListWithAll.forEach((hero: Hero) => {
            //filters match data for selected player
            let pushObj: TableRow = new TableRow();

            let filteredMatchData = [];
            startDateUnix = new Date(inputStartDate);
            endDateUnix = new Date(inputEndDate);

            //filter by heroID
            const findPlayer = playersWeCareAbout.find(
                (element) => element.playerName === selectedPlayer
            );
            if (findPlayer != undefined) {
                let playerIndex: number = playersWeCareAbout.indexOf(findPlayer);

                filteredMatchData = matchStats[playerIndex].matchData.filter(
                    (match: Match) => match.hero_id === hero.id
                );
                filteredMatchData = filteredMatchData.filter(
                    (match: Match) => match.start_time >= startDateUnix && match.start_time <= endDateUnix
                );

                pushObj.name = hero.localized_name;
                pushObj.games = filteredMatchData.length;
                pushObj.wins = filteredMatchData.reduce(
                    (acc: number, cur: Match) =>
                        acc + (winOrLoss(cur.player_slot, cur.radiant_win) ? 1 : 0),
                    0
                );
                pushObj.losses = filteredMatchData.length - pushObj.wins;
                pushObj.win_percentage = pushObj.wins / filteredMatchData.length || 0;
                pushObj.kills = filteredMatchData.reduce((acc: number, cur: Match) => acc + cur.kills, 0);
                pushObj.deaths = filteredMatchData.reduce(
                    (acc: number, cur: Match) => acc + cur.deaths,
                    0
                );
                pushObj.assists = filteredMatchData.reduce(
                    (acc: number, cur: Match) => acc + cur.assists,
                    0
                );
                pushObj.kda = (pushObj.kills + pushObj.assists) / pushObj.deaths || 0;

                tableData.push(pushObj);
            } else {
                throw new TypeError('Error selecting player!');
            }
        });
    }

    return tableData;
};

export const createStatsTableStore = (matchStats: MatchStats) => {
	const { subscribe, set, update } = writable({
		matchStats,
		sortBy,
		selectedPlayer:,
        orderBy: 'Config Count',
        //pagination: 1
	});

	return {
		subscribe,
		set,
		update
	};
};

export const searchHandler = (store: any) => {
	const searchTerm = store.search.toLowerCase() || '';
	store.filtered = store.data.filter((item: any) => {
		return item.searchTerms.toLowerCase().includes(searchTerm);
	});

    //console.log(store.orderBy)
    if(store.orderBy === "Config Count"){
        store.filtered.sort((a: any,b: any) => {
            if(a.value.subs.length === undefined) return 1
            if(b.value.subs.length === undefined) return -1
            if(a.value.subs.length > b.value.subs.length) return -1
            if(a.value.subs.length < b.value.subs.length) return 1
        })
    }
};

export const sortHandler = (sortBy: SortBy){
    tableData = {
        head: tableData.head,
        body: tableData.body.sort((a: any, b: any) => {
            if (a[sortBy.sortObj.index] < b[sortBy.sortObj.index]) return sortBy.ascending ? -1 : 1;
            else return sortBy.ascending ? 1 : -1;
        })
    };
}
