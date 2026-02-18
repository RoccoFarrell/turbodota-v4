import { fail, redirect, json } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { TurbotownMetric, TurbotownItem, User } from '@prisma/client';
import type { Item } from '@prisma/client';
import prisma from '$lib/server/prisma';

// export const actions: Actions = {
// 	createArticle: async ({ request, locals }) => {
// 		const session = await locals.auth.validate()
// 		console.log(session)
// 		const user = session.user
// 		if (!session || !user) {
// 			throw redirect(302, '/')
// 		}

// 		const { title, content } = Object.fromEntries(await request.formData()) as Record<
// 			string,
// 			string
// 		>

// 		try {
// 			await prisma.article.create({
// 				data: {
// 					title,
// 					content,
// 					userId: user.userId
// 				}
// 			})
// 		} catch (err) {
// 			console.error(err)
// 			return fail(500, { message: 'Could not create the article.' })
// 		}

// 		return {
// 			status: 201
// 		}
// 	},
// 	deleteArticle: async ({ url, locals }) => {
// 		const session = await locals.auth.validate()
// 		const user = session.user
// 		if (!session) {
// 			throw redirect(302, '/')
// 		}
// 		const id = url.searchParams.get('id')
// 		if (!id) {
// 			return fail(400, { message: 'Invalid request' })
// 		}

// 		try {
// 			const article = await prisma.article.findUniqueOrThrow({
// 				where: {
// 					id: Number(id)
// 				}
// 			})

// 			if (article.userId !== user.userId) {
// 				throw error(403, 'Not authorized')
// 			}

// 			await prisma.article.delete({
// 				where: {
// 					id: Number(id)
// 				}
// 			})
// 		} catch (err) {
// 			console.error(err)
// 			return fail(500, {
// 				message: 'Something went wrong deleting your article'
// 			})
// 		}

// 		return {
// 			status: 200
// 		}
// 	}
// }
