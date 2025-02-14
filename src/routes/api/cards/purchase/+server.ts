import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export async function POST({ request, locals }) {
    const session = await locals.auth.validate();
    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { cardId } = await request.json();

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.userId },
            include: { 
                dotaDeckGames: {
                    where: { status: 'ACTIVE' },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        const card = await prisma.heroCard.findUnique({
            where: { id: cardId }
        });

        if (!user?.dotaDeckGames.length || !card) {
            return json({ error: 'Invalid user or card' }, { status: 400 });
        }

        const activeGame = user.dotaDeckGames[0];

        if (activeGame.gold < card.cost) {
            return json({ error: 'Insufficient gold' }, { status: 400 });
        }

        // Purchase the card and create UserCard
        const [updatedGame, userCard] = await prisma.$transaction([
            prisma.dotaDeckGame.update({
                where: { id: activeGame.id },
                data: { 
                    gold: activeGame.gold - card.cost 
                }
            }),
            prisma.userCard.create({
                data: {
                    userId: user.id,
                    cardId: card.id
                }
            })
        ]);

        return json({ success: true, gameStats: updatedGame, userCard });
    } catch (error) {
        console.error('Error purchasing card:', error);
        return json({ error: 'Failed to purchase card' }, { status: 500 });
    }
} 