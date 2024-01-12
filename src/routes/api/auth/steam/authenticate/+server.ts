import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma'
//const SteamAuth = require("node-steam-openid");
import { auth } from '$lib/server/lucia'
import { LuciaError } from "lucia";
import steam from '../steam';

//helpers
import { createDotaUser } from '../../../helpers';
import { create } from 'domain';

export const GET: RequestHandler = async ({ request, locals, params, url }) => {
    console.log('received GET to authenticate')

    const steamUser = await steam.authenticate(request);

    let dbUser = null;
    try {
        dbUser = await auth.getUser(steamUser.steamid)
    } catch(e){
        if (e instanceof LuciaError && e.message === "AUTH_INVALID_USER_ID") {
            // invalid key
            console.log(`User ${steamUser.steamid} - ${steamUser.username} not found`)
        }
    }

    if(!dbUser){

        //need to create dotaUser for a new user before an actual user can be created
        let account_id = Number(steamUser.steamid.substr(-16,16)) - 6561197960265728
        let createDUResult = await createDotaUser(account_id)

        console.log(`[/authenticate] createDUResult: `, createDUResult) 

        if(createDUResult.account_id){
            dbUser = await auth.createUser({
                userId: steamUser.steamid,
                key: {
                    providerId: 'steam',
                    providerUserId: steamUser.steamid,
                    password: null
                },
                attributes: {
                    name: steamUser.name || "",
                    username: steamUser.username,
                    steam_id: steamUser.steamid,
                    account_id: account_id,
                    profile_url: steamUser.profile,
                    avatar_url: steamUser.avatar.small            
                }
            })
        } else console.error(`[/authenticate] failed to create dota user so couldnt create normal user`)
        
    }

    if (!locals.auth.validate()) {
        const session = await auth.createSession({
            userId: dbUser.userId,
            attributes: {}
        });
        locals.auth.setSession(session);
    } else {
        const key = await auth.useKey('steam', steamUser.steamid, null)
		const session = await auth.createSession({userId: key.userId, attributes: {}})
		locals.auth.setSession(session)
    }

    //...do something with the data
    redirect(302, '/random');
    //return new Response(JSON.stringify({ "user": user }))
};