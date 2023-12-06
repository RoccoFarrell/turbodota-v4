import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma'
//const SteamAuth = require("node-steam-openid");
import steam from './steam';

export const GET: RequestHandler = async ({ params, url }) => {
    console.log('received GET')
    const redirectUrl = await steam.getRedirectUrl();
    throw redirect(302, redirectUrl)
};