import type { PrismaClient } from '@prisma/client'

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: import('lucia').AuthRequest
		}
		// interface PageData {}
		// interface Platform {}
	}
	var __prisma: PrismaClient

	/// <reference types="lucia" />
	declare global {
		namespace Lucia {
			type Auth = import("$lib/server/lucia").Auth;
			type DatabaseUserAttributes = {
				username: string
				name: string
			};
			type DatabaseSessionAttributes = {};
		}
	}

	interface Locals {
        validate: import('lucia/sveltekit').Validate;
        validateUser: import('lucia/sveltekit').ValidateUser;
        setSession: import('lucia/sveltekit').SetSession;
        auth: import('lucia').AuthRequest;
    }
}

export { }
