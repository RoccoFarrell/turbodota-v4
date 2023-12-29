import fetch from 'node-fetch';
import * as fs from 'fs';
const playersWeCareAbout = [80636612, 34940151, 113003047, 65110965, 68024789, 423076846, 67762413, 125251142];
const matchesToSkip = [5304085637, 5637793913, 6033233731, 4847351935, 4888455966, 5202511518, 4896520517, 4831897782, 4055542139, 4019523324, 4068856483]

let j=1;

function sleep(ms: number) {
	return new Promise((resolve) => setInterval(resolve, ms));
}

const data = {
    accountIdsForCalc: [65110965, 34940151, 80636612, 113003047, 125251142, 423076846, 67762413, 68024789]
};

let headers = "account_id,match_id,start_time,winorloss,mmrModifier \n"

fs.writeFile('mmrs.csv', headers, 'utf8', function (err) {
    if (err) {console.log('Some error occured - file either not saved or corrupted file saved.');}
    else{console.log('It\'s saved!')}
})

let winrates = await fetch('https://turbodota.com/api/winrates?source=db', {
	method: 'POST',
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json'
	},
	body: JSON.stringify(data)
})
	.then((response: any) => response.json())
	.then((data: any) => {
		return data
	});

    //console.log(winrates)


async function getAllMatches(account_id: number, winrates) {
    console.log("Running: " + account_id)
	let player_match_response = await fetch('https://turbodota.com/api/updateMatchesForUser/' + account_id);
	let player_match_response_object = await player_match_response.json();

    let winorlossstring = 0

	//console.log(player_match_response_object);
	for (const match of player_match_response_object.matchData) {
        const friendsArray = Array();
        const friendsArray2 = Array();

        if (matchesToSkip.includes(match.match_id)) {
            console.log("Skipping broken match: " + match.match_id)
        }
        else {
            let send_match_for_parse_response = await fetch('https://turbodota.com/api/matches/' + match.match_id);
            let send_match_for_parse_response_object = await send_match_for_parse_response.json();
    
            console.log("Now handling match ID: " + match.match_id)
    
            for (const player of send_match_for_parse_response_object.matchDetailResult.matchDetail.players) {
                //console.log(player)
                if(player.account_id == account_id) {
                    if (player.win == 1) {
                        winorlossstring = 1
                        console.log("Match: " +match.match_id+" resulted in a WIN")
                    }
                    else {
                        winorlossstring = 0 
                        console.log("Match: " +match.match_id+" resulted in a LOSS")
                    }
                }
 
                if (playersWeCareAbout.includes(player.account_id) && player.account_id != account_id) {
                    //console.log("Found a friend to handle: " + player.account_id)
                    let tempArray = {}
                    tempArray.account_id = player.account_id
                    tempArray.hero_id = player.hero_id
                    //tempArray.win_or_loss = winorlossstring
                    // if (player.win == 1) {
                    //     tempArray.win_or_loss = 1
                    // }
                    // else {
                    //     tempArray.win_or_loss = 0
                    // }
                    friendsArray.push(tempArray)
                }
            }
            //console.log("Friends Array To Handle: " + JSON.stringify(friendsArray))
            //console.log(winrates.insert)
    
            for (const item of friendsArray) {
                let tempArray = {}
                tempArray.account_id = item.account_id
                tempArray.hero_id = item.hero_id
                //tempArray.win_or_loss = item.win_or_loss
                tempArray.games = winrates.insert.filter((rate) => rate.account_id === item.account_id)[0].heroesArr.filter(hero => hero.hero_id === item.hero_id)[0].games
                if (tempArray.games <= 7) {
                    tempArray.win_rate = .5
                }
                else {
                    tempArray.win_rate = winrates.insert.filter((rate) => rate.account_id === item.account_id)[0].heroesArr.filter(hero => hero.hero_id === item.hero_id)[0].winrate
                }
                friendsArray2.push(tempArray)
            }
            //console.log("Friends Array 2 To Handle: " + JSON.stringify(friendsArray2))
    
            //Do the math
            let mmrIndividualModifier = 0
            let mmrTotalMatchModifier = 0
            let i = 0
            for (const item of friendsArray2) {
                if (winorlossstring == 1){
                    mmrIndividualModifier = 5 + ((item.win_rate-.5)*10*-1)
                    //console.log("Won match! Adding to individual modifier: " + mmrIndividualModifier)
                }
                else {
                    mmrIndividualModifier = 5 - ((item.win_rate-.5)*10*-1)
                    //console.log("Lost match! Subtracting from individual modifier: " + mmrIndividualModifier)
                }
                mmrTotalMatchModifier += mmrIndividualModifier
                //console.log("mmrTotalMatchModifier is now: " + mmrTotalMatchModifier)
                i++
            }
            //console.log("mmrTotalMatchModifier is this before adding missing players: " + mmrTotalMatchModifier)
            mmrTotalMatchModifier = mmrTotalMatchModifier + (5*(5-i))
            console.log("mmrTotalMatchModifier is this after adding missing players: " + mmrTotalMatchModifier)
    
            //Store the mmrTotalMatchModifier value properly
            let string = account_id.toString() +"," + match.match_id.toString() +","+ match.start_time.toString() +","+ winorlossstring.toString() +","+ mmrTotalMatchModifier.toString() + "\n"
            fs.appendFile("mmrs.csv", string , (err) => { 
                if (err) { 
                  console.log(err); 
                } 
              }); 
        }
        console.log("Finished match #"+j)
        j++
        //console.log("Sleeping till next match")
        await sleep(100); //Can make this lower once it works, just used this for testing a single match lazily
	}
	
}

let playerID = 125251142;
getAllMatches(playerID, winrates);

// for (const torunplayer of playersWeCareAbout)
// {
//     let playerID = torunplayer;
//     getAllMatches(playerID, winrates);
// }

// 80636612   - Martin
// 34940151   - Roberts
// 113003047  - Dan
// 65110965   - Rocco
// 68024789   - Ben
// 423076846  - Chris
// 67762413   - Walker
// 125251142  - Matt
