import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { initializeDotaDeckSeason } from '$lib/server/dotadeck';

export async function POST({ request, params }) {
    const { name, startDate, endDate, type } = await request.json();
    
    try {
        const season = await prisma.season.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                type,
                leagueID: parseInt(params.slug),
                creatorID: 0, // Set appropriate creator ID
            }
        });

        // Initialize DotaDeck data if it's a DotaDeck season
        if (type === 'DotaDeck') {
            await initializeDotaDeckSeason(season);
        }

        return json({ success: true, season });
    } catch (error) {
        console.error('Error creating season:', error);
        return json({ success: false, error: 'Failed to create season' });
    }
} 