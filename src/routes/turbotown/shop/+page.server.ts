import { auth } from '$lib/server/lucia';
import { fail, redirect, json } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { User } from '@prisma/client';
import type { Item } from '@prisma/client';
import prisma from '$lib/server/prisma';

//import { createDotaUser } from '../api/helpers';

export const load: PageServerLoad = async ({ locals, parent }) => {
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
    createItem: async ({ request, locals }) => {
        //console.log('received form post')
        const session = await locals.auth.validate();
        if (!session) return fail(400, { message: 'Not logged in, cannot create item' });
        const formData = await request.formData()
    
        let shoppingCart = JSON.parse(formData.get('shoppingCart'))

        console.log('user trying to buy', session.user.account_id)
        console.log('shopping cart in form: ')
        console.log(JSON.stringify(shoppingCart))

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

            //this needs to become a transaction that checks
            // 1. user has enough gold
            // 2. increment turbotownItems
            // 3. decrement gold

            //https://www.prisma.io/docs/orm/prisma-client/queries/transactions

            let turbotownItemCreateResult = await prisma.turbotownItem.create({
                data: {
                    lastUpdated: new Date(),
                    turbotownID: 1,
                    itemID: 1,
                    status: 'applied'
                }
            });

            // let tx_result = prisma.$transaction(async (tx) => {
            //     // 1. Decrement amount from the sender.
            //     const sender = await tx.account.update({
            //       data: {
            //         balance: {
            //           decrement: amount,
            //         },
            //       },
            //       where: {
            //         email: from,
            //       },
            //     })
            
            //     // 2. Verify that the sender's balance didn't go below zero.
            //     if (sender.balance < 0) {
            //       throw new Error(`${from} doesn't have enough to send ${amount}`)
            //     }
            
            //     // 3. Increment the recipient's balance by amount
            //     const recipient = await tx.account.update({
            //       data: {
            //         balance: {
            //           increment: amount,
            //         },
            //       },
            //       where: {
            //         email: to,
            //       },
            //     })
            
            //     return recipient
            //   })



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
