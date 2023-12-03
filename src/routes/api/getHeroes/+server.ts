import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma'

export const GET: RequestHandler = async ({ params, url }) => {
    console.log(url)
    console.log(`[api] - received GET to ${url.href}`)
    console.log(`params: ${JSON.stringify(params)}`)


    let allHeroes: Hero[] = await fetch(encodeURI(`https://api.opendota.com/api/heroes`), {
    	method: 'get',
    	headers: { 'Content-Type': 'application/json' },
    })
    	//.then(data => console.log(data))
    	.then(data => data.json())
    	.then((json) => {
    		return (json)
    	});

    // //write to DB
    //need to properly query for combination of match id and account id 
    //https://github.com/prisma/prisma/discussions/19022
    allHeroes = allHeroes.map(hero => {
    	return {
    		...hero,
            roles: JSON.stringify(hero.roles)
    	}
    })

    //commented  out before i can fix
    allHeroes.forEach(async (hero: Hero) => {
        await prisma.hero.upsert({
            where: { id: hero.id },
            update: { ...hero },
            create: { ...hero }
        })
    })

    return new Response(JSON.stringify(allHeroes))
};