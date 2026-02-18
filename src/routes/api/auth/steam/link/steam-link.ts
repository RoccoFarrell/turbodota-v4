import SteamAuth from 'node-steam-openid';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

interface SteamAuthOptions {
	realm: string;
	returnUrl: string;
	apiKey: string;
}

const STEAM_API_KEY = env.STEAM_API_KEY || 'EE3C24BAF27E921B77EFF80F9DBB969D';

const initialization: SteamAuthOptions = dev
	? {
			realm: 'http://localhost:5173',
			returnUrl: 'http://localhost:5173/api/auth/steam/link/callback',
			apiKey: STEAM_API_KEY
		}
	: {
			realm: 'https://turbodota.com',
			returnUrl: 'https://turbodota.com/api/auth/steam/link/callback',
			apiKey: STEAM_API_KEY
		};

export const steamLink = new SteamAuth(initialization);
