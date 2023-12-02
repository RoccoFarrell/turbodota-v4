import { PrismaClient } from "@prisma/client"
import { env } from "$env/dynamic/private"

const client = global.__prisma || new PrismaClient()
// const client = new PrismaClient({
// 	log: ['query', 'info', 'warn', 'error']
// })

// if (env.NODE_ENV === "development") {
// 	global.__prisma = client
// }

export { client }
