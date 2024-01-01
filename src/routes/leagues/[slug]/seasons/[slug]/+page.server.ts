import { fail, redirect, json } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Season } from '@prisma/client';
import prisma from '$lib/server/prisma';

//import { createDotaUser } from '../api/helpers';

export const load: PageServerLoad = async ({ locals, parent, params }) => {
	const parentData = await parent();
	const session = await locals.auth.validate();
	if (!session) {
		redirect(302, '/');
	}

	let selectedSeason: Season | null = parentData.selectedLeague.seasons.filter((season: Season) => season.id === parseInt(params.slug))[0] || null

	const allRandoms =  await prisma.random.findMany({
		include: { seasons: true }
	});

	return {
		...parentData,
		selectedSeason,
		allRandoms
	};
};

export const actions: Actions = {
	updateSeasonRandoms: async ({ request, locals, url}) => {
		const session = await locals.auth.validate();
		const formData = await request.formData()
		console.log("FORM DATA: ", formData)

		let inputIDs = formData.get('selectedDataIds')?.toString() || ""
		let seasonID = parseInt(formData.get('seasonID')?.toString() || "0")

		let randomsList: number[] = JSON.parse(`[${inputIDs}]`)

		console.log(`[updateSeasonRandoms] FOUND ${randomsList.length} randoms to add to season ${seasonID}`)

		if(session && session.user && session.user.roles.includes('dev')){
			let randomUpdateResult = await prisma.season.update({
				where: {
					id: seasonID
				},
				data: {
					randoms: {
							connect: randomsList.map((randomID: any) => {return {id: randomID}})
						}	
					}
			})

			console.log(`[updateSeasonRandoms] randomUpdateResult:`, randomUpdateResult)
		} else {
			return fail(400, { message: 'not an admin'})
		}
	}}