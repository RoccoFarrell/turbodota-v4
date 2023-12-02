// import { sveltekit } from 'lucia-auth/middleware'
import { lucia } from 'lucia'
import { prisma } from '@lucia-auth/adapter-prisma'
import { sveltekit } from 'lucia/middleware'
import { dev } from '$app/environment'
import { client } from '$lib/server/prisma'
//import { PrismaClient } from "@prisma/client";

// const client = new PrismaClient({
// 	log: ['query', 'info', 'warn', 'error']
// });

export const auth = lucia({
	adapter: prisma(client),
	env: dev ? 'DEV' : 'PROD',
	middleware: sveltekit(),
	getUserAttributes: (data) => {
		return {
			// IMPORTANT!!!!
			// `userId` included by default!!
			username: data.username,
			name: data.name
		};
	},
})

export type Auth = typeof auth
