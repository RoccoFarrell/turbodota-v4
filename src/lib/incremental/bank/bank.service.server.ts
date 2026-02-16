/**
 * Bank service – single source of truth for currency balances and item inventory per save.
 * All currency reads/writes and item add/remove go through these helpers.
 * Supports both standalone Prisma client and transaction-scoped usage.
 *
 * See docs/incremental/BANK_SYSTEM.md for design context.
 */

import prisma from '$lib/server/prisma';

// ---------------------------------------------------------------------------
// Types for transaction-scoped usage
// ---------------------------------------------------------------------------

/** Minimal Prisma client interface so callers can pass either prisma or a $transaction tx. */
export interface BankTx {
	incrementalBankCurrency: {
		findUnique: (args: {
			where: { saveId_currencyKey: { saveId: string; currencyKey: string } };
			select?: { amount: true };
		}) => Promise<{ amount: number } | null>;
		findMany: (args: {
			where: { saveId: string };
			select?: { currencyKey: true; amount: true };
		}) => Promise<{ currencyKey: string; amount: number }[]>;
		upsert: (args: {
			where: { saveId_currencyKey: { saveId: string; currencyKey: string } };
			create: { saveId: string; currencyKey: string; amount: number };
			update: { amount: { increment: number } };
		}) => Promise<unknown>;
		update: (args: {
			where: { saveId_currencyKey: { saveId: string; currencyKey: string } };
			data: { amount: number };
		}) => Promise<unknown>;
	};
	incrementalBankItem: {
		findUnique: (args: {
			where: { saveId_itemDefId: { saveId: string; itemDefId: string } };
			select?: { quantity: true };
		}) => Promise<{ quantity: number } | null>;
		findMany: (args: {
			where: { saveId: string; quantity?: { gt: number } };
			select?: { itemDefId: true; quantity: true };
		}) => Promise<{ itemDefId: string; quantity: number }[]>;
		upsert: (args: {
			where: { saveId_itemDefId: { saveId: string; itemDefId: string } };
			create: { saveId: string; itemDefId: string; quantity: number };
			update: { quantity: { increment: number } };
		}) => Promise<unknown>;
		update: (args: {
			where: { saveId_itemDefId: { saveId: string; itemDefId: string } };
			data: { quantity: number };
		}) => Promise<unknown>;
	};
}

// ---------------------------------------------------------------------------
// Currency helpers
// ---------------------------------------------------------------------------

/** Get a single currency balance (0 if missing). */
export async function getBankBalance(
	saveId: string,
	currencyKey: string,
	tx: BankTx = prisma as unknown as BankTx
): Promise<number> {
	const row = await tx.incrementalBankCurrency.findUnique({
		where: { saveId_currencyKey: { saveId, currencyKey } },
		select: { amount: true }
	});
	return row?.amount ?? 0;
}

/** Get all currency balances for a save. Returns a plain object { currencyKey: amount }. */
export async function getBankBalances(
	saveId: string,
	tx: BankTx = prisma as unknown as BankTx
): Promise<Record<string, number>> {
	const rows = await tx.incrementalBankCurrency.findMany({
		where: { saveId },
		select: { currencyKey: true, amount: true }
	});
	const balances: Record<string, number> = {};
	for (const r of rows) {
		balances[r.currencyKey] = r.amount;
	}
	return balances;
}

/** Add (credit) a currency. Creates the row if missing. Amount must be > 0. */
export async function addBankCurrency(
	saveId: string,
	currencyKey: string,
	amount: number,
	tx: BankTx = prisma as unknown as BankTx
): Promise<void> {
	if (amount <= 0) return;
	await tx.incrementalBankCurrency.upsert({
		where: { saveId_currencyKey: { saveId, currencyKey } },
		create: { saveId, currencyKey, amount },
		update: { amount: { increment: amount } }
	});
}

/**
 * Deduct (spend) a currency. Throws if balance would go negative.
 * Returns new balance.
 */
export async function deductBankCurrency(
	saveId: string,
	currencyKey: string,
	amount: number,
	tx: BankTx = prisma as unknown as BankTx
): Promise<number> {
	if (amount <= 0) return getBankBalance(saveId, currencyKey, tx);
	const current = await getBankBalance(saveId, currencyKey, tx);
	if (current < amount) {
		throw new Error(`Insufficient ${currencyKey}: have ${current}, need ${amount}`);
	}
	const newAmount = current - amount;
	await tx.incrementalBankCurrency.update({
		where: { saveId_currencyKey: { saveId, currencyKey } },
		data: { amount: newAmount }
	});
	return newAmount;
}

// ---------------------------------------------------------------------------
// Item inventory helpers
// ---------------------------------------------------------------------------

/** Get all items with quantity > 0 for a save. */
export async function getBankItems(
	saveId: string,
	tx: BankTx = prisma as unknown as BankTx
): Promise<{ itemDefId: string; quantity: number }[]> {
	return tx.incrementalBankItem.findMany({
		where: { saveId, quantity: { gt: 0 } },
		select: { itemDefId: true, quantity: true }
	});
}

/** Get quantity of a specific item (0 if missing). */
export async function getBankItemQuantity(
	saveId: string,
	itemDefId: string,
	tx: BankTx = prisma as unknown as BankTx
): Promise<number> {
	const row = await tx.incrementalBankItem.findUnique({
		where: { saveId_itemDefId: { saveId, itemDefId } },
		select: { quantity: true }
	});
	return row?.quantity ?? 0;
}

/** Add items to inventory (upsert; creates row if missing). */
export async function addBankItem(
	saveId: string,
	itemDefId: string,
	quantity: number,
	tx: BankTx = prisma as unknown as BankTx
): Promise<void> {
	if (quantity <= 0) return;
	await tx.incrementalBankItem.upsert({
		where: { saveId_itemDefId: { saveId, itemDefId } },
		create: { saveId, itemDefId, quantity },
		update: { quantity: { increment: quantity } }
	});
}

/**
 * Remove items from inventory. Throws if not enough.
 * Returns new quantity.
 */
export async function removeBankItem(
	saveId: string,
	itemDefId: string,
	count: number,
	tx: BankTx = prisma as unknown as BankTx
): Promise<number> {
	if (count <= 0) return getBankItemQuantity(saveId, itemDefId, tx);
	const current = await getBankItemQuantity(saveId, itemDefId, tx);
	if (current < count) {
		throw new Error(`Insufficient ${itemDefId}: have ${current}, need ${count}`);
	}
	const newQuantity = current - count;
	await tx.incrementalBankItem.update({
		where: { saveId_itemDefId: { saveId, itemDefId } },
		data: { quantity: newQuantity }
	});
	return newQuantity;
}
