import { auth } from '$lib/server/lucia';
import { fail, redirect, json } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { User } from '@prisma/client';
import type { Item } from '@prisma/client';
import prisma from '$lib/server/prisma';

//import { createDotaUser } from '../api/helpers';

export const load: PageServerLoad = async ({ locals, parent }) => {
    const parentData = await parent();
    console.log('parent data', parentData)
    const session = await locals.auth.validate();
    if (!session) {
        redirect(302, '/');
    }

    return {
        ...parentData
    };
};

export const actions: Actions = {
    createItem: async ({ request, locals }) => {
        const session = await locals.auth.validate();
        if (!session) return fail(400, { message: 'Not logged in, cannot create item' });
        const { leagueName, dotaUsersList } = Object.fromEntries(await request.formData()) as Record<string, string>;

        try {
            //console.log(leagueName, dotaUsersList);

            // let parsedDUList = dotaUsersList.split(',');
            // if (!parsedDUList.length || parsedDUList.length === 0) return fail(400, { dotaUsersList, missing: true });

            //create dotauser list

            // interface createItem {
            // 	account_id: number;
            // 	lastUpdated: Date;
            // }

            let testItem = {
                id: 1,
                name: 'test',
                description: 'test',
                imgSrc: 'test',
                goldCost: 10,
                quantityAvailable: 10,
                active: true,
            };

            //parentData.town.items;
            let createItemList: Item[] = [testItem, testItem]

            // let createItemList: createUser[] = parsedDUList.map((userID) => {
            //     let userObj: createUser = {
            //         account_id: parseInt(userID) | 0,
            //         lastUpdated: new Date()
            //     };

            console.log(`item list: `, createItemList);
            if (createItemList.length < 1) {
                console.log('form failed');
                return fail(400, { createItemList, missing: true });
            }

            let turbotownItemCreateResult = await prisma.turbotownItem.create({
                data: {
                    lastUpdated: new Date(),
                    turbotownID: 1,
                    itemID: 1,
                    status: 'applied'
                }
            });

            console.log(turbotownItemCreateResult);
            if (turbotownItemCreateResult) return { success: true };
        } catch (err) {
            console.error(err);
            return fail(400, { message: 'Could not create item' });
        }
        console.log('item created');
        //console.log('username:', username, ' password:', password)
        redirect(302, '/shop');
    }
};
