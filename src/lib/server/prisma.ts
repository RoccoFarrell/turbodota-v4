//import { PrismaClient } from "@prisma/client"
//import { PrismaClient as PrismaClientProd} from '@prisma-prod/client'
//import { PrismaClient as PrismaClientDev} from '@prisma-dev/client'
import { env } from "$env/dynamic/private"


//const prisma = global.__prisma || new PrismaClient()
// const client = new PrismaClient({
// 	log: ['query', 'info', 'warn', 'error']
// })

const prismaClientSingleton = async () => {

    console.log(`[prisma.ts] Running in ${process.env.NODE_ENV}`)
    if (process.env.NODE_ENV !== "development") {
        const { PrismaClient } = await import('@prisma-prod/client')
        return new PrismaClient()     
    } else {
        const { PrismaClient } = await import('@prisma-dev/client')
        return new PrismaClient()   
    }
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export { prisma }

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

//export { prisma }