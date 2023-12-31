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

	const allRandoms =  await prisma.random.findMany();

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

		let test = formData.get('test')?.toString() || ""
		console.log('test: ', test)
	}}