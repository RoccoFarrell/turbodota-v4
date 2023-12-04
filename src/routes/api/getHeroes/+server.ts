import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma'

export const GET: RequestHandler = async ({ params, url }) => {
    console.log(url)
    console.log(`[api] - received GET to ${url.href}`)
    console.log(`params: ${JSON.stringify(params)}`)
    //check if user was updated recently, otherwise use the database
    

    let forceUpdate: boolean = false;
    let updateInterval = new Date()
    let dataSource: string = ""
    
    let allHeroes: Hero[] = []

    //updateInterval.setMinutes(rightNow.getMinutes() - (60 * 24));
    if (!forceUpdate) {
        console.log('fetch from DB')
        const heroResult = await prisma.hero.findMany()

        //console.log(matchesResult)
        allHeroes = heroResult
        dataSource = "db"
    } else {
        console.log('fetch from OD')
        dataSource = "od"

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
        allHeroes = allHeroes.map(hero => {
            return {
                ...hero,
                roles: JSON.stringify(hero.roles)
            }
        })
    
        allHeroes.forEach(async (hero: Hero) => {
            await prisma.hero.upsert({
                where: { id: hero.id },
                update: { ...hero },
                create: { ...hero }
            })
        })
    }

    return new Response(JSON.stringify({allHeroes, dataSource }))
};