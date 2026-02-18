import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Require authentication
	if (!locals.user) {
		throw redirect(302, '/');
	}

	return {
		user: locals.user
	};
};

export const actions: Actions = {
	/**
	 * Manually set account_id (for users without Steam linking)
	 */
	setAccountId: async ({ request, locals }) => {
		if (!locals.user) {
			throw error(401, 'Not authenticated');
		}

		const data = await request.formData();
		const accountIdStr = data.get('account_id');

		if (!accountIdStr || typeof accountIdStr !== 'string') {
			return { success: false, error: 'Account ID is required' };
		}

		const account_id = parseInt(accountIdStr, 10);

		if (isNaN(account_id) || account_id <= 0) {
			return { success: false, error: 'Invalid account ID' };
		}

		try {
			const prisma = (await import('$lib/server/prisma')).default;

			// Check if account_id is already used
			const existing = await prisma.user.findUnique({
				where: { account_id }
			});

			if (existing && existing.id !== locals.user.id) {
				return { success: false, error: 'This account ID is already in use' };
			}

			// Update user
			await prisma.user.update({
				where: { id: locals.user.id },
				data: { account_id }
			});

			return { success: true };
		} catch (err) {
			console.error('Set account_id error:', err);
			return { success: false, error: 'Failed to update account ID' };
		}
	}
};
