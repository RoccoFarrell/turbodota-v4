import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';
import { DOTADECK } from '$lib/constants/dotadeck';

export const POST: RequestHandler = async ({ request, locals }) => {
    const session = await locals.auth.validate();
    if (!session) {
        return json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { itemId } = await request.json();
    if (!itemId) {
        return json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    try {
        // Get the active season
        const activeSeason = await prisma.season.findFirst({
            where: { active: true }
        });

        if (!activeSeason) {
            return json({ success: false, error: 'No active season found' }, { status: 400 });
        }

        // Get the user's season data
        const seasonUser = await prisma.seasonUser.findFirst({
            where: {
                accountId: session.user.account_id,
                seasonId: activeSeason.id
            }
        });

        if (!seasonUser) {
            return json({ success: false, error: 'User not found in active season' }, { status: 400 });
        }

        // Get the user's item from their inventory
        const userItem = await prisma.seasonUserItem.findFirst({
            where: {
                id: itemId,
                seasonUserId: seasonUser.id
            },
            include: {
                item: true
            }
        });

        if (!userItem) {
            return json({ success: false, error: 'Item not found in inventory' }, { status: 404 });
        }

        // Check if it's a charm effect
        if (userItem.item.effectType === DOTADECK.CHARM_EFFECTS.BOUNTY_MULTIPLIER || 
            userItem.item.effectType === DOTADECK.CHARM_EFFECTS.XP_MULTIPLIER) {
            
            // Check if there's already an active charm of this type
            const existingCharm = await prisma.dotadeckCharmEffect.findFirst({
                where: {
                    seasonUserId: seasonUser.id,
                    effectType: userItem.item.effectType,
                    isActive: true,
                    expiresAt: {
                        gt: new Date()
                    }
                }
            });

            if (existingCharm) {
                return json({ 
                    success: false, 
                    error: `You already have an active ${userItem.item.effectType === DOTADECK.CHARM_EFFECTS.BOUNTY_MULTIPLIER ? 'Bounty' : 'XP'} charm` 
                }, { status: 400 });
            }
        }

        // Apply item effects
        let effectApplied = false;
        let effectDetails = null;
        let updatedActiveCharms = null;

        switch (userItem.item.effectType) {
            case 'DISCARD_TOKEN':
                // Add discard tokens to the user's season data
                const updatedUser = await prisma.seasonUser.update({
                    where: { id: seasonUser.id },
                    data: {
                        discardTokens: seasonUser.discardTokens + userItem.item.effectValue
                    }
                });
                effectApplied = true;
                effectDetails = {
                    type: 'DISCARD_TOKEN',
                    value: userItem.item.effectValue,
                    newTotal: updatedUser.discardTokens
                };
                break;

            case DOTADECK.CHARM_EFFECTS.BOUNTY_MULTIPLIER:
                // Create a charm effect for the next match
                const bountyEffect = await prisma.dotadeckCharmEffect.create({
                    data: {
                        seasonUserId: seasonUser.id,
                        itemId: userItem.item.id,
                        effectType: DOTADECK.CHARM_EFFECTS.BOUNTY_MULTIPLIER,
                        effectValue: userItem.item.effectValue,
                        isActive: true,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
                    }
                });
                effectApplied = true;
                effectDetails = {
                    type: DOTADECK.CHARM_EFFECTS.BOUNTY_MULTIPLIER,
                    value: userItem.item.effectValue,
                    message: 'Bounty multiplier applied for next match'
                };
                break;

            case DOTADECK.CHARM_EFFECTS.XP_MULTIPLIER:
                // Create a charm effect that lasts for 24 hours
                await prisma.dotadeckCharmEffect.create({
                    data: {
                        seasonUserId: seasonUser.id,
                        itemId: userItem.item.id,
                        effectType: DOTADECK.CHARM_EFFECTS.XP_MULTIPLIER,
                        effectValue: userItem.item.effectValue,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                        isActive: true
                    }
                });
                effectApplied = true;
                effectDetails = {
                    type: DOTADECK.CHARM_EFFECTS.XP_MULTIPLIER,
                    value: userItem.item.effectValue,
                    message: 'XP multiplier applied for next match'
                };
                break;

            default:
                return json({ success: false, error: 'Unknown effect type' }, { status: 400 });
        }

        if (!effectApplied) {
            return json({ success: false, error: 'Failed to apply item effect' }, { status: 500 });
        }

        // Get updated active charms
        updatedActiveCharms = await prisma.dotadeckCharmEffect.findMany({
            where: {
                seasonUserId: seasonUser.id,
                isActive: true,
                expiresAt: {
                    gt: new Date()
                }
            }
        });

        // If quantity is 1, delete the item, otherwise decrement quantity by 1
        if (userItem.quantity === 1) {
            await prisma.seasonUserItem.delete({
                where: { id: userItem.id }
            });
        } else {
            await prisma.seasonUserItem.update({
                where: { id: userItem.id },
                data: { quantity: userItem.quantity - 1 }
            });
        }

        return json({
            success: true,
            data: {
                effect: effectDetails,
                activeCharms: updatedActiveCharms
            }
        });
    } catch (error) {
        console.error('Error using item:', error);
        return json({ success: false, error: 'Failed to use item' }, { status: 500 });
    }
}; 