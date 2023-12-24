import prisma from '$lib/server/prisma'

export const createDotaUser = async (account_id: number) => {
    let createDUResult = await prisma.dotaUser.upsert({
        where: { account_id},
        create: {
            account_id,
            lastUpdated: new Date()
        }, 
        update: {
            account_id,
            lastUpdated: new Date()
        }
    })

    return createDUResult
}

