// @ts-nocheck - msw is not installed; these mocks are unused scaffolding
import { setupServer } from "msw/node";
import { http, bypass, HttpResponse } from "msw";
//import winOrLoss from "$lib/helpers/winOrLoss";

const handlers = [
  http.get("*", ({ request }) => {
   console.log(`[mock] - got request ${request.url}`)
  }),

  http.get("/api/updateMatchesForUser/65110965", async ({ request }) => {
        console.log("[mock] - mocking updateMatchesForUser")
        const response = await fetch(bypass(request))
        const realMatchData = await response.json()

        realMatchData.push({
            account_id: "65110965",
            assists: 17,
            average_rank: 51,
            deaths: 5,
            duration: 2101,
            game_mode: 23,
            hero_id: 129,
            id: 1,
            kills: 10,
            leaver_status: 0,
            lobby_type: 0,
            match_id: "6681000801",
            party_size: 2,
            player_slot: 131,
            radiant_win: false,
            kill: null,
            start_time: new Date(),
            version: null
        })

        return HttpResponse.json({
            ...realMatchData,
            mocked: true
        })
   })
];

export const server = setupServer(...handlers);