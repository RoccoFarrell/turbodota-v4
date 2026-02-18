import { fail, redirect, json } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

//import { createDotaUser } from '../api/helpers';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const parentData = await parent();
	const user = locals.user;
	if (!user) {
		redirect(302, '/');
	}

    console.log(`PARENT DATA LINE 13 SEASONS PAGE SERVER: `, parentData)

	return {
		...parentData
	};
};
