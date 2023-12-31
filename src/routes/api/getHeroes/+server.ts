import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Hero } from '@prisma/client'
import prisma from '$lib/server/prisma'

export const GET: RequestHandler = async ({ params, url }) => {
    console.log(`-----------\n[api/getHeroes] - received GET to ${url.href}\n-----------`)
    //console.log(`params: ${JSON.stringify(params)}`)
    //check if user was updated recently, otherwise use the database

    let forceUpdate: boolean = false;
    let updateInterval = new Date()
    let dataSource: string = ""

    let allHeroes: Hero[] = []

    //updateInterval.setMinutes(rightNow.getMinutes() - (60 * 24));
    if (!forceUpdate) {
        console.log('[/api/getHeroes] fetch from DB')
        const heroResult = await prisma.hero.findMany()

        //console.log(matchesResult)
        allHeroes = heroResult
        dataSource = "db"
    } else {
        console.log('[/api/getHeroes] fetch from OD')
        dataSource = "od"

        allHeroes = await fetch(encodeURI(`https://api.opendota.com/api/heroes`), {
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
        })
            //.then(data => console.log(data))
            .then(data => data.json())
            .then((json) => {
                return (json)
            });

        //console.log(allHeroes.length)

        // //write to DB
        allHeroes = allHeroes.map(hero => {
            return {
                ...hero,
                roles: JSON.stringify(hero.roles)
            }
        })

        //sort by name before returning
        //     const transactions = (allHeroes.map(async (hero: Hero) => {
        //         await tx.hero.upsert({
        //             where: { id: hero.id },
        //         update: { ...hero },
        //         create: { ...hero }
        //         })
        //     }))
        // })
        const heroCollection = await prisma.$transaction(async (tx) => {
            await Promise.all(allHeroes.map(async (hero: Hero) => {
                await tx.hero.upsert({
                    where: { id: hero.id },
                    update: { ...hero },
                    create: { ...hero }
                })
            }))
        })
    }

    return new Response(JSON.stringify({ allHeroes, dataSource }))
};