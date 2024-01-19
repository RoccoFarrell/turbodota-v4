import prisma from "$lib/server/prisma"

const findRandomDotaUser = async () => {
    const dotaUsers = await prisma.dotaUser.findMany()

    let accountIDs = dotaUsers.map(user => user.account_id)

    const randomMatch = await prisma.playersMatchDetail.findFirst({
        where: {
            account_id:{
                not:{
                    in: accountIDs
                }
            }
        },
        orderBy: {
            match_id: 'desc'
        }
    })
    return randomMatch?.account_id
}


export { findRandomDotaUser }