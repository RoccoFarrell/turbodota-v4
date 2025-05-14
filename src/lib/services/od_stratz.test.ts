// test/sample.test.ts
import { describe, it, expect, test, vi, beforeAll } from 'vitest'; // 👈🏻 Added the `vi` import
//import prisma from './__mocks__/prisma'1

import { query3rdPartyAPI } from './od_stratz';
//import { env } from '$env/dynamic/private';

vi.mock('./prisma');

// test('findHeroes should return heroes', async () => {
//   //const newUser = { email: 'user@prisma.io', name: 'Prisma Fan' }
//   prisma.hero.findMany.mockResolvedValue([{ attack_type: "Melee", id: 102, legs: 2, localized_name: "Abbadon", name: "npc_dota_hero_abbadon", primary_attr: "all", roles: "[\"Support\",\"Carry\",\"Durable\"]"}])
//   const heroes = await findHeroes()
//   expect(heroes).toStrictEqual([{ attack_type: "Melee", id: 102, legs: 2, localized_name: "Abbadon", name: "npc_dota_hero_abbadon", primary_attr: "all", roles: "[\"Support\",\"Carry\",\"Durable\"]"}])
// })

const query = `
    query {player(steamAccountId:65110965) {
		steamAccountId
		matches(request: {
		  take: 10,
		  gameModeIds:[23]
			}) {
		  id
		  gameMode
		  startDateTime
		  endDateTime
		  durationSeconds
		  isStats
		  players(steamAccountId:65110965){
			steamAccountId
			isRadiant
			isVictory
			partyId
			heroId
			kills
			assists
			deaths
			
		  }
		}
	  }
	}
	`;

describe('odstratz service', () => {
  let stratz_response: Response
  let myResponse: Response
  let body: any = {}
  let myResponseBody: any = {}
  //console.log(import.meta.env)
	beforeAll(async () => {
		stratz_response = await fetch('https://api.stratz.com/graphql', {
			method: 'POST',
			headers: new Headers({
				'Content-Type': 'application/json',
				Authorization: `Bearer ${import.meta.env.VITE_STRATZ_TOKEN}`
			}),
			body: JSON.stringify({
				query
			})
		});

    body = await stratz_response.json()

    myResponse = await query3rdPartyAPI("stratz", "recentMatches")
    myResponseBody = await myResponse.json()
    //console.log(body)
	});

//   it('comparison call should have response status 200', () =>{
//     expect(stratz_response.status).toBe(200)
//   })

//   it('comparison call has a body', () => {
// 		expect(body.data).toBeDefined()
// 	});

  it('call should have response status 200', () =>{
    expect(myResponse.status).toBe(200)
  })

  it('call has a body', () => {
		expect(myResponseBody.data).toBeDefined()
	});
});
