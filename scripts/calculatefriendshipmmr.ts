import fetch from 'node-fetch';
const playersWeCareAbout = [80636612, 34940151, 113003047, 65110965, 68024789, 423076846, 67762413, 125251142];

function sleep(ms: number) {
	return new Promise((resolve) => setInterval(resolve, ms));
}

const data = {
    accountIdsForCalc: [65110965, 34940151, 80636612, 113003047, 125251142, 423076846, 67762413, 68024789]
};

let winrates = await fetch('https://turbodota.com/api/winrates?source=db', {
	method: 'POST',
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json'
	},
	body: JSON.stringify(data)
})
	.then((response) => response.json())
	.then((data) => {
		return data
	});

    console.log(winrates)


async function getAllMatches(account_id: number, winrates) {
	let player_match_response = await fetch('https://turbodota.com/api/updateMatchesForUser/' + account_id);
	let player_match_response_object = await player_match_response.json();

	//console.log(player_match_response_object);
	for (const match of player_match_response_object.matchData) {
        const friendsArray = Array();
        const friendsArray2 = Array();


		let send_match_for_parse_response = await fetch('https://turbodota.com/api/matches/' + match.match_id);
		let send_match_for_parse_response_object = await send_match_for_parse_response.json();

        console.log("Now handling match ID: " + match.match_id)

		for (const player of send_match_for_parse_response_object.matchDetailResult.matchDetail.players) {
            //console.log(player)
			if (playersWeCareAbout.includes(player.account_id) && player.account_id != account_id) {
                console.log("Found a friend to handle: " + player.account_id)
                let tempArray = {}
                tempArray.account_id = player.account_id
                tempArray.hero_id = player.hero_id
                if (player.win == 1) {tempArray.win_or_loss = 1}
                else {tempArray.win_or_loss = 0}
                friendsArray.push(tempArray)
            }
		}
        console.log("Friends Array To Handle: " + JSON.stringify(friendsArray))

        for (const item of friendsArray) {
            let tempArray = {}
            tempArray.account_id = item.account_id
            tempArray.hero_id = item.hero_id
            tempArray.win_or_loss = item.win_or_loss
            tempArray.win_rate = .4 // actually get win rates
            friendsArray2.push(tempArray)
        }
        console.log("Friends Array 2 To Handle: " + JSON.stringify(friendsArray2))

        //Do the math
        let mmrIndividualModifier = 0
        let mmrTotalMatchModifier = 0
        let i = 0
        for (const item of friendsArray2) {
            if (item.win_loss_flag == 1){
                mmrIndividualModifier = 5 + ((item.win_rate-.5)*10*-1)
                console.log("Won match! Adding to individual modifier: " + mmrIndividualModifier)
            }
            else {
                mmrIndividualModifier = 5 - ((item.win_rate-.5)*10*-1)
                console.log("Lost match! Subtracting from individual modifier: " + mmrIndividualModifier)
            }
            mmrTotalMatchModifier += mmrIndividualModifier
            console.log("mmrTotalMatchModifier is now: " + mmrTotalMatchModifier)
            i++
        }
        console.log("mmrTotalMatchModifier is this before adding missing players: " + mmrTotalMatchModifier)
        mmrTotalMatchModifier = mmrTotalMatchModifier + (5*(5-i))
        console.log("mmrTotalMatchModifier is this after adding missing players: " + mmrTotalMatchModifier)

        //Store the mmrTotalMatchModifier value properly


        console.log("Sleeping till next match")
        await sleep(30000); //Can make this lower once it works, just used this for testing a single match lazily
	}
	
}

let playerID = 80636612;
getAllMatches(playerID, winrates);

// 80636612   - Martin
// 34940151   - Roberts
// 113003047  - Dan
// 65110965   - Rocco
// 68024789   - Ben
// 423076846  - Chris
// 67762413   - Walker
// 125251142  - Matt
