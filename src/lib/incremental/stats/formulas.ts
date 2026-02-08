/**
 * Stat formulas for incremental battle.
 * Used by the battle engine; no engine code here.
 */

import type { DamageType } from '../types';
import { DamageType as DamageTypeConst } from '../types';

/** Effective attack interval (seconds). base / (1 + attackSpeed); optional min cap. */
export function attackInterval(
	baseInterval: number,
	attackSpeed: number,
	options?: { minInterval?: number }
): number {
	const interval = baseInterval / (1 + attackSpeed);
	const min = options?.minInterval;
	return min != null && interval < min ? min : interval;
}

/** Effective spell interval (seconds). base / (1 + spellHaste); optional min cap. */
export function spellInterval(
	baseInterval: number,
	spellHaste: number,
	options?: { minInterval?: number }
): number {
	const interval = baseInterval / (1 + spellHaste);
	const min = options?.minInterval;
	return min != null && interval < min ? min : interval;
}

/** Attack damage. Flat base + optional modifiers (e.g. flat bonus). */
export function attackDamage(
	baseDamage: number,
	modifiers?: { flat?: number }
): number {
	const flat = modifiers?.flat ?? 0;
	return baseDamage + flat;
}

/** Spell damage for active spells. Base + spell power (flat). */
export function spellDamage(baseDamage: number, spellPower: number): number {
	return baseDamage + spellPower;
}

/** When attacking non-focus enemy, damage is reduced. When attacking focus, full damage. */
const NON_FOCUS_MULTIPLIER = 0.5;

export function nonFocusTargetPenalty(
	damage: number,
	isTargetEnemyFocus: boolean
): number {
	return isTargetEnemyFocus ? damage : damage * NON_FOCUS_MULTIPLIER;
}

// ---------------------------------------------------------------------------
// Damage types and resistance
// ---------------------------------------------------------------------------

/** Physical damage reduced by armor. Formula: damage * 100 / (100 + armor). */
export function applyPhysicalDamage(damage: number, targetArmor: number): number {
	if (damage <= 0) return 0;
	return (damage * 100) / (100 + targetArmor);
}

/** Magical damage reduced by magic resist (0–1). Formula: damage * (1 - magicResist). */
export function applyMagicalDamage(
	damage: number,
	targetMagicResist: number
): number {
	if (damage <= 0) return 0;
	return damage * (1 - targetMagicResist);
}

/** Pure damage bypasses armor and magic resist. */
export function applyPureDamage(damage: number): number {
	return Math.max(0, damage);
}

/** Apply damage by type: physical (vs armor), magical (vs magic resist), pure (no reduction). */
export function applyDamageByType(
	damage: number,
	damageType: DamageType,
	target: { armor: number; magicResist: number }
): number {
	switch (damageType) {
		case DamageTypeConst.PHYSICAL:
			return applyPhysicalDamage(damage, target.armor);
		case DamageTypeConst.MAGICAL:
			return applyMagicalDamage(damage, target.magicResist);
		case DamageTypeConst.PURE:
			return applyPureDamage(damage);
		default:
			return applyPureDamage(damage);
	}
}
