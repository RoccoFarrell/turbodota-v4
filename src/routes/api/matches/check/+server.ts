import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export async function POST({ request, fetch }) {
    const { seasonUserId, heroId } = await request.json();
    
    console.log("Creating hero draw for:", { seasonUserId, heroId });
    // Get the season user
    const seasonUser = await prisma.seasonUser.findUnique({
        where: { id: seasonUserId },
        select: {
            accountId: true
        }
    });

    console.log("Found season user:", seasonUser);
    if (!seasonUser) return json({ success: false });

    try {
        // Create hero draw record
        const heroDraw = await prisma.heroDraw.create({
            data: {
                seasonUserId,
                heroId,
            }
        });

        console.log("Created hero draw:", heroDraw);

        // Update matches using existing endpoint with full URL
        const baseUrl = process.env.ORIGIN || 'http://localhost:5173';
        await fetch(`${baseUrl}/api/updateMatchesForUser/${seasonUser.accountId}`);

        // Check if any matches were played with this hero since the draw
        const matchAfterDraw = await prisma.match.findFirst({
            where: {
                account_id: seasonUser.accountId,
                hero_id: heroId,
                start_time: {
                    gt: Math.floor(heroDraw.drawnAt.getTime() / 1000)
                }
            },
            orderBy: {
                start_time: 'desc'
            }
        });

        if (matchAfterDraw) {
            // Update the draw record with the match result
            const won = matchAfterDraw.player_slot <= 127 ? matchAfterDraw.radiant_win : !matchAfterDraw.radiant_win;
            await prisma.heroDraw.update({
                where: { id: heroDraw.id },
                data: {
                    matchResult: won,
                    matchId: matchAfterDraw.match_id.toString()
                }
            });

            return json({ success: true, won, matchId: matchAfterDraw.match_id });
        }

        return json({ success: true });
    } catch (error) {
        console.error("Error creating hero draw:", error);
        return json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
} 