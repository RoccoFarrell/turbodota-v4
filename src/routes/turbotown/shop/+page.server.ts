import { auth } from '$lib/server/lucia';
import { fail, redirect, json } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { TurbotownMetric, TurbotownItem, User } from '@prisma/client';
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

            if (shoppingCart.itemList.length < 1) {
                console.log('form failed');
                return fail(400, { shoppingCart, missing: true });
            }

            //this needs to become a transaction that checks
            // 1. user has enough gold
            // 2. increment turbotownItems
            // 3. decrement gold

            //https://www.prisma.io/docs/orm/prisma-client/queries/transactions

            let tx_result = prisma.$transaction(async (tx) => {
                // 1. Decrement amount from the user
                const sender = await tx.turbotownMetric.update({
                    data: {
                        value: {
                            decrement: shoppingCart.totalCost,
                        },
                    },
                    where: {
                        townPlusLabel: { turbotownID: 1, label: "gold" }
                    },
                })

                // 2. Verify that the users balance didn't go below zero.
                if (sender.value < 0) {
                    throw new Error(`${session.user.account_id} doesn't have enough to buy selected items`)
                }


                // 3. Add items to user's inventory
                let recordData: Array<any> = new Array();
                shoppingCart.itemList.forEach((item: any, i: number) => {
                    let pushObj = {
                        itemID: item.id,
                        lastUpdated: new Date(),
                        status: 'inactive',
                        turbotownID: 1
                    }
                    recordData.push(pushObj)
                });

                console.log('record data:', recordData)

                const recipient = await tx.turbotownItem.createMany({
                    data: recordData
                })

                return recipient
            })

            if (await tx_result) return { success: true };

        } catch (err) {
            console.error(err);
            return fail(400, { message: 'Could not create item' });
        }
        console.log('item created');
        //console.log('username:', username, ' password:', password)
        redirect(302, '/shop');
    }
};
