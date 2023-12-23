import prisma from '$lib/server/prisma'

export const createDotaUser = async (account_id: number) => {
    let createDUResult = await prisma.dotaUser.create({
        data: {
            account_id,
            lastUpdated: new Date()
        }
    })

    return createDUResult
}

