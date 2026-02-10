/**
 * Reads data/Hero_rows.csv and generates:
 *   data/heroes_base_stats.csv  (HeroDef-style: heroId, base stats, abilityId)
 *   data/hero_abilities.csv     (AbilityDef: id, type, trigger, effect, target, damageType, baseDamage, returnDamageRatio)
 * Run: node scripts/generate-hero-csvs.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

function parseCsvLine(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let end = i + 1;
      while (end < line.length && (line[end] !== '"' || line[end + 1] === '"')) {
        if (line[end] === '"' && line[end + 1] === '"') end += 2;
        else end += 1;
      }
      out.push(line.slice(i + 1, end).replace(/""/g, '"'));
      i = end + 1;
      if (line[i] === ',') i += 1;
    } else {
      const comma = line.indexOf(',', i);
      if (comma === -1) {
        out.push(line.slice(i));
        break;
      }
      out.push(line.slice(i, comma));
      i = comma + 1;
    }
  }
  return out;
}

function escapeCsv(val) {
  if (val == null || val === '') return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// Map primary_attr to our PrimaryAttribute
function mapPrimaryAttr(attr) {
  if (attr === 'all') return 'universal';
  return attr || 'str';
}

// Default base stats by attribute (placeholder; edit in Sheets)
function defaultBaseStats(primaryAttr) {
  const base = {
    str: { baseAttackInterval: 1.7, baseAttackDamage: 30, baseMaxHp: 180, baseArmor: 2, baseMagicResist: 0.25, baseSpellInterval: 10 },
    agi: { baseAttackInterval: 1.5, baseAttackDamage: 26, baseMaxHp: 140, baseArmor: 1, baseMagicResist: 0.25, baseSpellInterval: 8 },
    int: { baseAttackInterval: 1.7, baseAttackDamage: 24, baseMaxHp: 120, baseArmor: 0, baseMagicResist: 0.25, baseSpellInterval: 8 },
    universal: { baseAttackInterval: 1.6, baseAttackDamage: 26, baseMaxHp: 150, baseArmor: 1, baseMagicResist: 0.25, baseSpellInterval: 9 }
  };
  return base[primaryAttr] || base.str;
}

// Ability id from hero name: npc_dota_hero_antimage -> antimage_ability (placeholder; edit to real ability id)
function heroNameToAbilityId(name) {
  const slug = name.replace(/^npc_dota_hero_/, '');
  return slug + '_ability';
}

// Default ability row (placeholder)
function defaultAbilityRow(abilityId) {
  return {
    id: abilityId,
    type: 'active',
    trigger: 'timer',
    effect: 'magic_damage',
    target: 'single_enemy',
    damageType: 'magical',
    baseDamage: 80,
    returnDamageRatio: ''
  };
}

const heroCsv = fs.readFileSync(path.join(dataDir, 'Hero_rows.csv'), 'utf-8');
const lines = heroCsv.split(/\r?\n/).filter(Boolean);
const header = parseCsvLine(lines[0]);
const rows = lines.slice(1).map((line) => parseCsvLine(line));

const heroBaseStatsRows = [];
const abilityRows = [];

for (const row of rows) {
  const id = parseInt(row[0], 10);
  const name = row[1] || '';
  const localized_name = row[2] || '';
  const primary_attr = (row[3] || 'str').toLowerCase();
  if (isNaN(id) || !name) continue;

  const primaryAttribute = mapPrimaryAttr(primary_attr);
  const stats = defaultBaseStats(primaryAttribute);
  const abilityId = heroNameToAbilityId(name);

  heroBaseStatsRows.push({
    heroId: id,
    localized_name,
    primaryAttribute,
    baseAttackInterval: stats.baseAttackInterval,
    baseAttackDamage: stats.baseAttackDamage,
    baseMaxHp: stats.baseMaxHp,
    baseArmor: stats.baseArmor,
    baseMagicResist: stats.baseMagicResist,
    baseSpellInterval: stats.baseSpellInterval,
    abilityId
  });

  abilityRows.push(defaultAbilityRow(abilityId));
}

// Write heroes_base_stats.csv
const baseStatsHeader = 'heroId,localized_name,primaryAttribute,baseAttackInterval,baseAttackDamage,baseMaxHp,baseArmor,baseMagicResist,baseSpellInterval,abilityId';
const baseStatsLines = [
  baseStatsHeader,
  ...heroBaseStatsRows.map((r) =>
    [
      r.heroId,
      escapeCsv(r.localized_name),
      r.primaryAttribute,
      r.baseAttackInterval,
      r.baseAttackDamage,
      r.baseMaxHp,
      r.baseArmor,
      r.baseMagicResist,
      r.baseSpellInterval === null ? '' : r.baseSpellInterval,
      r.abilityId
    ].join(',')
  )
];
fs.writeFileSync(path.join(dataDir, 'heroes_base_stats.csv'), baseStatsLines.join('\n'), 'utf-8');
console.log('Wrote data/heroes_base_stats.csv (' + heroBaseStatsRows.length + ' rows)');

// Write hero_abilities.csv (AbilityDef columns)
const abilityHeader = 'id,type,trigger,effect,target,damageType,baseDamage,returnDamageRatio';
const abilityLines = [
  abilityHeader,
  ...abilityRows.map((r) =>
    [
      r.id,
      r.type,
      r.trigger,
      escapeCsv(r.effect),
      escapeCsv(r.target),
      escapeCsv(r.damageType),
      r.baseDamage === '' ? '' : r.baseDamage,
      r.returnDamageRatio === '' ? '' : r.returnDamageRatio
    ].join(',')
  )
];
fs.writeFileSync(path.join(dataDir, 'hero_abilities.csv'), abilityLines.join('\n'), 'utf-8');
console.log('Wrote data/hero_abilities.csv (' + abilityRows.length + ' rows)');
