import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	// If user is fully authenticated with a Dota account, send them to the game
	if (user?.account_id) {
		redirect(302, '/incremental');
	}
	return {
		isAuthenticated: !!user,
		hasAccount: !!user?.account_id
	};
};
