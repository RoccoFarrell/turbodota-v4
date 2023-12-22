import { PrismaClient } from '@prisma/client';
import { env } from '$env/dynamic/private';

// if (env.NODE_ENV === "development") {
// 	options = {
//         log: ['query', 'info', 'warn', 'error']
//     }
// }

// const prisma = new PrismaClient(options)
// prisma.$on('query', (e) => {
//     console.log(e)
// })

const prisma = new PrismaClient({
	//log: [{ level: 'query', emit: 'event' }]
});

// prisma.$on('query', (e) => {
// 	console.log(e);
// });

export default prisma;
