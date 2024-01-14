import { auth } from '$lib/server/lucia';
import { fail, redirect, json } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { TurbotownMetric, TurbotownItem, User } from '@prisma/client';
import type { Item } from '@prisma/client';
import prisma from '$lib/server/prisma';

//import { createDotaUser } from '../api/helpers';

export const actions: Actions = {
    useItem: async ({ request, locals }) => {
        //console.log('received form post')
        const session = await locals.auth.validate();
        if (!session) return fail(400, { message: 'Not logged in, cannot use item' });
        const formData = await request.formData()
        let hero = JSON.parse(formData.get('observerSelect'))
        console.log('random hero select:', hero)

        console.log('user trying to use item', session.user.account_id)
        try {
            let tx_result = prisma.$transaction(async (tx) => {

                // 1. Verify that the user has at least one of the item in inventory
                let itemCheck = await tx.turbotownItem.findFirstOrThrow();
                //console.log('itemCheck:', itemCheck)

                // 2. Decrement item from the user
                if (itemCheck) {
                    const sender = await tx.turbotownItem.delete({
                        where: {
                            id: itemCheck.id
                        },
                    })

                    if (!sender) {
                        throw new Error(`${session.user.account_id} failed to delete item!`)
                    }
                }
            })
        }
        catch (err) {
            console.error(err);
            return fail(400, { message: 'Could not delte item' });
        }

        try {
            let tx_result = prisma.$transaction(async (tx) => {
                const sender = await tx.turbotownActions.create({
                    // need to fix hardcoded values
                    data: {
                        action: 'observer',
                    }
                })
            })
        }
        catch (err) {
            console.error(err);
            return fail(400, { message: 'Could not add action' });
        }
    }
};
