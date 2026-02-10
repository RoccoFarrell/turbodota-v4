/**
 * Reads data/Hero_rows.csv and data/dota2_heroes.csv, then generates:
 *   data/heroes_base_stats.csv  (balanced varied base stats + abilityId1, abilityId2)
 *   data/hero_abilities.csv     (2 abilities per hero: stuns, nukes, heals, on-hit, shields, passives)
 * Run: node scripts/populate-hero-csvs-from-descriptions.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

function parseCsv(content) {
  const lines = [];
  let i = 0;
  while (i < content.length) {
    const row = [];
    while (i < content.length) {
      if (content[i] === '"') {
        i++;
        let field = '';
        while (i < content.length && (content[i] !== '"' || content[i + 1] === '"')) {
          if (content[i] === '"' && content[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            field += content[i++];
          }
        }
        if (content[i] === '"') i++;
        row.push(field);
      } else {
        let field = '';
        while (i < content.length && content[i] !== ',' && content[i] !== '\n' && content[i] !== '\r') field += content[i++];
        row.push(field.trim());
      }
      if (content[i] === ',') {
        i++;
      } else if (content[i] === '\r' || content[i] === '\n') {
        while (content[i] === '\r' || content[i] === '\n') i++;
        break;
      }
    }
    if (row.some((c) => c.length > 0)) lines.push(row);
  }
  return lines;
}

function escapeCsv(val) {
  if (val == null || val === '') return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function slug(name) {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// Infer theme from character description for stat tuning
function inferTheme(desc) {
  const d = (desc || '').toLowerCase();
  if (d.includes('tank') || d.includes('durable') || d.includes('harder to kill') || d.includes('punishes attackers')) return 'tank';
  if (d.includes('carry') || d.includes('damage') && d.includes('cleave')) return 'carry';
  if (d.includes('support') || d.includes('heal') || d.includes('allies') || d.includes('protect')) return 'support';
  if (d.includes('nuker') || d.includes('incinerates') || d.includes('devastating') || d.includes('magical')) return 'nuker';
  if (d.includes('initiator') || d.includes('charge') || d.includes('stun')) return 'initiator';
  return 'mixed';
}

// Deterministic variance from hero name (0-1)
function varianceSeed(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return (h % 100) / 100;
}

// Balanced base stats by primary attr and theme. Small per-hero variance for variety.
function baseStats(primaryAttr, theme, heroName) {
  const v = varianceSeed(heroName);
  const attr = primaryAttr === 'all' ? 'universal' : primaryAttr;
  const base = {
    str: { hp: 180, dmg: 28, armor: 2.5, atkInt: 1.65, spellInt: 10 },
    agi: { hp: 140, dmg: 26, armor: 1, atkInt: 1.45, spellInt: 9 },
    int: { hp: 120, dmg: 22, armor: 0.5, atkInt: 1.7, spellInt: 8 },
    universal: { hp: 150, dmg: 25, armor: 1.5, atkInt: 1.55, spellInt: 9 }
  };
  const b = { ...base[attr] || base.str };
  if (theme === 'tank') {
    b.hp = Math.min(220, b.hp + 35);
    b.armor = Math.min(5, b.armor + 1.5);
    b.dmg = Math.max(20, b.dmg - 3);
  } else if (theme === 'carry') {
    b.dmg = Math.min(36, b.dmg + 5);
    b.atkInt = Math.max(1.2, b.atkInt - 0.15);
    b.hp = Math.max(110, b.hp - 15);
  } else if (theme === 'support') {
    b.spellInt = Math.max(6, b.spellInt - 1.5);
    b.dmg = Math.max(18, b.dmg - 4);
  } else if (theme === 'nuker') {
    b.dmg = Math.max(20, b.dmg - 2);
    b.spellInt = Math.max(6, b.spellInt - 1);
  } else if (theme === 'initiator') {
    b.hp = b.hp + 15;
    b.armor = b.armor + 0.5;
  }
  return {
    baseAttackInterval: Math.round((b.atkInt + (v - 0.5) * 0.08) * 100) / 100,
    baseAttackDamage: Math.round(b.dmg + (v - 0.5) * 4),
    baseMaxHp: Math.round(b.hp + (v - 0.5) * 20),
    baseArmor: Math.max(-1, Math.round((b.armor + (v - 0.5) * 0.8) * 10) / 10),
    baseMagicResist: 0.25,
    baseSpellInterval: Math.round((b.spellInt + (v - 0.5) * 1.5) * 10) / 10
  };
}

// Ability templates for variety: a) stuns b) damage spells c) heals d) on-hit e) shields f) passives
const ABILITY_PATTERNS = {
  stun: { type: 'active', trigger: 'timer', effect: 'stun', target: 'single_enemy', damageType: '', baseDamage: '', returnDamageRatio: '' },
  nuke_magical: { type: 'active', trigger: 'timer', effect: 'magic_damage', target: 'single_enemy', damageType: 'magical', baseDamage: 85, returnDamageRatio: '' },
  nuke_physical: { type: 'active', trigger: 'timer', effect: 'physical_damage', target: 'single_enemy', damageType: 'physical', baseDamage: 70, returnDamageRatio: '' },
  heal: { type: 'active', trigger: 'timer', effect: 'heal_lowest_ally_damage_nearby', target: 'lowest_hp_ally', damageType: '', baseDamage: '', returnDamageRatio: '' },
  on_hit_slow: { type: 'passive', trigger: 'on_attack', effect: 'slow_on_hit', target: 'attacked_enemy', damageType: 'magical', baseDamage: 15, returnDamageRatio: '' },
  on_hit_bonus: { type: 'passive', trigger: 'on_attack', effect: 'bonus_damage', target: 'attacked_enemy', damageType: 'physical', baseDamage: 20, returnDamageRatio: '' },
  shield: { type: 'active', trigger: 'timer', effect: 'damage_block', target: 'self', damageType: '', baseDamage: '', returnDamageRatio: '' },
  passive_return: { type: 'passive', trigger: 'on_damage_taken', effect: 'return_damage', target: 'attacker', damageType: 'physical', baseDamage: '', returnDamageRatio: 0.18 },
  dot: { type: 'active', trigger: 'timer', effect: 'magic_damage', target: 'single_enemy', damageType: 'magical', baseDamage: 55, returnDamageRatio: '' }
};

/** Parse "Abilities" column from dota2_heroes: "Name (desc), Name (desc)" -> [{ name, description }, ...] */
function parseLoreAbilities(abilitiesText) {
  if (!abilitiesText || !abilitiesText.trim()) return [];
  const out = [];
  const chunks = abilitiesText.split(/\),\s*/);
  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    const paren = trimmed.indexOf(' (');
    const name = paren >= 0 ? trimmed.slice(0, paren).trim() : trimmed;
    const description = paren >= 0 ? trimmed.slice(paren + 2).trim() : '';
    if (name) out.push({ name, description });
  }
  return out;
}

function chooseTwoAbilities(desc, abilitiesText) {
  const d = (desc || '').toLowerCase();
  const a = (abilitiesText || '').toLowerCase();
  const choices = [];
  if (d.includes('stun') || a.includes('stun') || d.includes('initiator')) choices.push('stun');
  if (d.includes('heal') || a.includes('heal') || d.includes('support') || d.includes('purif')) choices.push('heal');
  if (d.includes('return') || a.includes('counter') || a.includes('reflect') || a.includes('retaliat')) choices.push('passive_return');
  if (d.includes('shield') || a.includes('shield') || a.includes('block') || a.includes('bulwark')) choices.push('shield');
  if (d.includes('attack') && (d.includes('bonus') || d.includes('on hit') || a.includes('orb'))) choices.push('on_hit_bonus');
  if (d.includes('slow') || a.includes('slow')) choices.push('on_hit_slow');
  if (d.includes('nuker') || d.includes('magic') || d.includes('spell') || a.includes('nuke')) choices.push('nuke_magical');
  if (d.includes('physical') || a.includes('cleave') || a.includes('bash')) choices.push('nuke_physical');
  if (a.includes('damage over time') || a.includes('dot') || a.includes('poison')) choices.push('dot');
  const pool = ['stun', 'nuke_magical', 'heal', 'on_hit_slow', 'on_hit_bonus', 'shield', 'passive_return', 'dot', 'nuke_physical'];
  const pick = (fromList) => {
    for (const p of fromList) {
      if (pool.includes(p)) return p;
    }
    return fromList[0];
  };
  const preferred = choices.length ? choices : ['stun', 'nuke_magical'];
  const first = pick(preferred);
  const rest = pool.filter((x) => x !== first);
  const secondPreferred = preferred.filter((x) => x !== first);
  const second = pick(secondPreferred.length ? secondPreferred : rest);
  return [first, second];
}

function buildAbilityRow(id, patternKey, abilityName = '', abilityDescription = '') {
  const p = ABILITY_PATTERNS[patternKey] || ABILITY_PATTERNS.nuke_magical;
  return {
    id,
    abilityName: abilityName || '',
    description: abilityDescription || '',
    type: p.type,
    trigger: p.trigger,
    effect: p.effect,
    target: p.target,
    damageType: p.damageType || '',
    baseDamage: p.baseDamage === '' ? '' : p.baseDamage,
    returnDamageRatio: p.returnDamageRatio === '' ? '' : p.returnDamageRatio
  };
}

// Load CSVs
const heroRowsContent = fs.readFileSync(path.join(dataDir, 'Hero_rows.csv'), 'utf-8');
const dota2Content = fs.readFileSync(path.join(dataDir, 'dota2_heroes.csv'), 'utf-8');

const heroRows = parseCsv(heroRowsContent);
const dota2Rows = parseCsv(dota2Content);

const dota2ByName = new Map();
for (let i = 1; i < dota2Rows.length; i++) {
  const name = dota2Rows[i][0]?.trim() || '';
  if (name) dota2ByName.set(name.toLowerCase(), { name: dota2Rows[i][0], abilities: dota2Rows[i][1], description: dota2Rows[i][2] });
}

const heroHeader = heroRows[0];
const heroData = heroRows.slice(1).filter((r) => r[0] && !isNaN(parseInt(r[0], 10)));

const baseStatsRows = [];
const abilityRows = [];

for (const row of heroData) {
  const heroId = parseInt(row[0], 10);
  const name = row[1] || '';
  const localized_name = row[2] || '';
  const primary_attr = (row[3] || 'str').toLowerCase();
  const primaryAttribute = primary_attr === 'all' ? 'universal' : primary_attr;

  const key = localized_name.toLowerCase().trim();
  let dota2 = dota2ByName.get(key);
  if (!dota2) {
    for (const [, v] of dota2ByName) {
      if (v.name.trim().toLowerCase() === key) {
        dota2 = v;
        break;
      }
    }
  }
  const desc = dota2?.description || '';
  const abilitiesText = dota2?.abilities || '';
  const theme = inferTheme(desc);
  const stats = baseStats(primaryAttribute, theme, localized_name);
  const heroSlug = name.replace(/^npc_dota_hero_/, '');
  const [pattern1, pattern2] = chooseTwoAbilities(desc, abilitiesText);
  const abilityId1 = `${heroSlug}_1`;
  const abilityId2 = `${heroSlug}_2`;
  const loreAbilities = parseLoreAbilities(abilitiesText);
  const ab1 = loreAbilities[0];
  const ab2 = loreAbilities[1];
  const abilityName1 = ab1?.name ?? '';
  const abilityName2 = ab2?.name ?? '';
  const abilityDesc1 = ab1?.description ?? '';
  const abilityDesc2 = ab2?.description ?? '';

  baseStatsRows.push({
    heroId,
    localized_name,
    primaryAttribute,
    ...stats,
    abilityId1,
    abilityId2
  });

  abilityRows.push(buildAbilityRow(abilityId1, pattern1, abilityName1, abilityDesc1));
  abilityRows.push(buildAbilityRow(abilityId2, pattern2, abilityName2, abilityDesc2));
}

// Write heroes_base_stats.csv (with abilityId1, abilityId2)
const baseHeader = 'heroId,localized_name,primaryAttribute,baseAttackInterval,baseAttackDamage,baseMaxHp,baseArmor,baseMagicResist,baseSpellInterval,abilityId1,abilityId2';
const baseLines = [
  baseHeader,
  ...baseStatsRows.map((r) =>
    [
      r.heroId,
      escapeCsv(r.localized_name),
      r.primaryAttribute,
      r.baseAttackInterval,
      r.baseAttackDamage,
      r.baseMaxHp,
      r.baseArmor,
      r.baseMagicResist,
      r.baseSpellInterval,
      r.abilityId1,
      r.abilityId2
    ].join(',')
  )
];
fs.writeFileSync(path.join(dataDir, 'heroes_base_stats.csv'), baseLines.join('\n'), 'utf-8');
console.log('Wrote data/heroes_base_stats.csv (' + baseStatsRows.length + ' heroes)');

// Write hero_abilities.csv
const abilityHeader = 'id,ability_name,description,type,trigger,effect,target,damageType,baseDamage,returnDamageRatio';
const abilityLines = [
  abilityHeader,
  ...abilityRows.map((r) =>
    [
      r.id,
      escapeCsv(r.abilityName),
      escapeCsv(r.description),
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
console.log('Wrote data/hero_abilities.csv (' + abilityRows.length + ' abilities)');
