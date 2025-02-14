import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export async function GET() {
    const cards = await prisma.heroCard.findMany({
        take: 5,
        orderBy: {
            id: 'asc'
        },
        skip: Math.floor(Math.random() * await prisma.heroCard.count())
    });

    return json({ cards });
} 