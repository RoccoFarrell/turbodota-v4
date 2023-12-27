import { auth } from '$lib/server/lucia';
import { fail, redirect, json } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { User } from '@prisma/client';
import prisma from '$lib/server/prisma';
import dayjs from "dayjs"
import type { League } from '@prisma/client';

//import { createDotaUser } from '../api/helpers';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
	const parentData = await parent();
	const session = await locals.auth.validate();
	if (!session) {
		redirect(302, '/');
	}

	return {
		...parentData
	};
};

export const actions: Actions = {
	createSeason: async ({ request, locals, url}) => {
		const session = await locals.auth.validate();

		//console.log(locals)

		if (!session.user.roles.includes('dev')) return fail(400, { message: 'Not an admin' });

		console.log(`\n---------\n[FORM createSeason] - submission received \n-----------`)
		const formData = await request.formData()

		try {
			console.log(formData);

			//console.log(`dota user list: `, createdUserList);

			let seasonType = formData.get('seasonType')?.toString() || ""
			let seasonStartDate = formData.get('seasonStartDate')?.toString() || ""
			let seasonEndDate = formData.get('seasonEndDate')?.toString() || ""
			let leagueName = formData.get('leagueName')?.toString() || ""
			let seasonMembers = JSON.parse(`[${formData.get('members')?.toString()}]`|| "[]")
			let seasonCreatorID = parseInt(formData.get('creatorID')?.toString() || "0")
			let leagueID = parseInt(formData.get('leagueID')?.toString() || "0")

			let seasonName = leagueName.split(' ').map(word => word[0].toUpperCase()).join("")

			let seasonNameFormatted = seasonName + ' - ' + seasonType[0].toUpperCase() + seasonType.slice(1) + ' - ' + dayjs(seasonStartDate).format("MMM YYYY")

			if (!seasonType) {
				console.log('form failed');
				return fail(400, { seasonType, missing: true });
			}
			if(!seasonStartDate || !seasonEndDate) {
				console.log('form failed');
				return fail(400, { seasonStartDate, seasonEndDate, missing: true });
			}
			let seasonCreateResult;
			if(seasonType && seasonStartDate && seasonEndDate && leagueName && seasonMembers && seasonCreatorID && leagueID){
				seasonCreateResult = await prisma.season.create({
					data: {
						name: seasonNameFormatted,
						creatorID: seasonCreatorID,
						leagueID,
						startDate: dayjs(seasonStartDate).toDate(),
						endDate: dayjs(seasonEndDate).toDate(),
						type: seasonType,
						members: {
							connect: seasonMembers.map((account_id: any) => {
								return {
									account_id
								};
							})
						}
					}
				});
			}
			
			if (seasonCreateResult) {
				console.log(seasonCreateResult);
				return { success: true };
			}
		} catch (err) {
			console.error(err);
			return fail(400, { message: 'Could not create season' });
		}
		console.log('season created');
		//console.log('username:', username, ' password:', password)
		redirect(302, url.pathname);
	}
};
