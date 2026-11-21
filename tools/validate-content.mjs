import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'src/content/private';
const errors = [];
const warnings = [];

async function readJsonFiles(dir) {
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((name) => name.endsWith('.json')).sort();
  const values = [];
  for (const file of files) {
    values.push({ file, value: JSON.parse(await readFile(path.join(dir, file), 'utf8')) });
  }
  return values;
}

function textOf(value) {
  return JSON.stringify(value);
}

if (!existsSync(ROOT)) {
  console.log('content:check: no private content (sample fallback OK)');
  process.exit(0);
}

const chapters = await readJsonFiles(path.join(ROOT, 'chapters'));
const reports = await readJsonFiles(path.join(ROOT, 'reports'));
const effects = await readJsonFiles(path.join(ROOT, 'effects'));
const drugsFile = path.join(ROOT, 'drugs.json');
const battlesFile = path.join(ROOT, 'battles.json');
const drugs = existsSync(drugsFile)
  ? JSON.parse(await readFile(drugsFile, 'utf8'))
  : [];
const cards = drugs.length ? [{ file: 'drugs.json', value: drugs }] : [];
const battles = existsSync(battlesFile)
  ? [{ file: 'battles.json', value: JSON.parse(await readFile(battlesFile, 'utf8')) }]
  : [];
const sceneIds = new Set();
const allScenes = new Map();

for (const { file, value } of chapters) {
  if (!value.id || !Array.isArray(value.scenes)) {
    errors.push(`${file}: chapter needs id and scenes[]`);
    continue;
  }
  for (const scene of value.scenes) {
    if (!scene.id) {
      errors.push(`${file}: scene without id`);
      continue;
    }
    if (sceneIds.has(scene.id)) errors.push(`${file}: duplicate scene ${scene.id}`);
    sceneIds.add(scene.id);
    allScenes.set(scene.id, { scene, chapter: value.id });
    if (!Array.isArray(scene.beats) || scene.beats.length === 0) {
      errors.push(`${scene.id}: no beats`);
    }
    const beats = Array.isArray(scene.beats) ? scene.beats : [];
    for (const beat of beats) {
      if (!beat.type) errors.push(`${scene.id}: beat without type`);
      if (beat.type === 'choice') {
        if (!Array.isArray(beat.options) || beat.options.length < 2) {
          errors.push(`${scene.id}: choice needs >=2 options`);
        }
        for (const option of beat.options ?? []) {
          if (!option.label) errors.push(`${scene.id}: option without label`);
          if (option.targetScene && option.targetScene.trim() === '') {
            errors.push(`${scene.id}: empty scene target`);
          }
        }
      }
    }
    if (scene.next && scene.next.trim() === '') {
      errors.push(`${scene.id}: empty next`);
    }
  }
}

for (const { scene, chapter } of allScenes.values()) {
  if (scene.next && !allScenes.has(scene.next)) {
    warnings.push(`${chapter}/${scene.id}: next ${scene.next} is not in the imported chapters`);
  }
  for (const beat of scene.beats ?? []) {
    if (beat.type !== 'choice') continue;
    for (const option of beat.options ?? []) {
      if (option.targetScene && !allScenes.has(option.targetScene)) {
        warnings.push(
          `${chapter}/${scene.id}: choice target ${option.targetScene} is not imported yet`,
        );
      }
    }
  }
}


// Reachability: every chapter root plus all choice/next targets must cover all scenes.
const roots = chapters.flatMap(({ value }) =>
  value.id === 'side'
    ? value.scenes.map((scene) => scene.id)
    : value.scenes[0]?.id
      ? [value.scenes[0].id]
      : [],
);
const visited = new Set();
const queue = [...roots];
while (queue.length) {
  const id = queue.shift();
  if (!id || visited.has(id)) continue;
  visited.add(id);
  const item = allScenes.get(id);
  if (!item) continue;
  const { scene } = item;
  if (scene.next) queue.push(scene.next);
  for (const beat of scene.beats ?? []) {
    if (beat.type !== 'choice') continue;
    for (const option of beat.options ?? []) {
      if (option.targetScene) queue.push(option.targetScene);
    }
  }
}
for (const id of allScenes.keys()) {
  if (!visited.has(id)) errors.push(`${id}: unreachable from any chapter root`);
}

// 每一场用到的背景图都要真的在 assets-private/bg 里
const BG_ALIAS = { bg_summer_street: 'bg_dlc_summer_street' };
for (const { scene } of allScenes.values()) {
  const bg = scene.stage?.bg;
  if (!bg) continue;
  const asset = BG_ALIAS[bg] ?? bg;
  if (!existsSync(path.join('public', 'assets-private', 'bg', `${asset}.png`))) {
    errors.push(`${scene.id}: missing background ${bg}`);
  }
}

const reportIds = new Set();
for (const { file, value } of reports) {
  if (!value.id || !Array.isArray(value.segments)) {
    errors.push(`${file}: report needs id and segments[]`);
    continue;
  }
  if (reportIds.has(value.id)) errors.push(`${file}: duplicate report ${value.id}`);
  reportIds.add(value.id);
  const segmentIds = new Set();
  for (const segment of value.segments) {
    if (!segment.id) errors.push(`${file}: segment without id`);
    if (segmentIds.has(segment.id)) errors.push(`${file}: duplicate segment ${segment.id}`);
    segmentIds.add(segment.id);
    if (!segment.summary) errors.push(`${file}: segment ${segment.id} without summary`);
    if (segment.sceneId && !sceneIds.has(segment.sceneId)) {
      errors.push(`${file}: segment ${segment.id} points at missing scene ${segment.sceneId}`);
    }
  }
}

const cardIds = new Set();
for (const { file, value } of cards) {
  const list = Array.isArray(value) ? value : [];
  for (const card of list) {
    if (!card.id || !card.name) errors.push(`${file}: drug needs id and name`);
    if (cardIds.has(card.id)) errors.push(`${file}: duplicate drug ${card.id}`);
    cardIds.add(card.id);
    if (!['drug', 'action'].includes(card.kind)) errors.push(`${file}: ${card.id} bad kind`);
    if (!['other', 'otc', 'rx', 'c2', 'c1', 'narcotic'].includes(card.klass)) {
      errors.push(`${file}: ${card.id} bad class`);
    }
    if (!Array.isArray(card.card?.proper) || card.card.proper.length === 0) {
      errors.push(`${file}: ${card.id} has no proper ops`);
    }
    if (card.card?.over && !Array.isArray(card.card.over)) {
      errors.push(`${file}: ${card.id} bad over ops`);
    }
    if (card.card?.course && !Array.isArray(card.card.course.ops)) {
      errors.push(`${file}: ${card.id} bad course`);
    }
    if (card.kind !== 'drug') continue;
    if (!Array.isArray(card.tags) || card.tags.length === 0) {
      errors.push(`${file}: ${card.id} needs tags`);
    }
    if (!Array.isArray(card.substrates) || !Array.isArray(card.inducers)) {
      errors.push(`${file}: ${card.id} needs substrates[] and inducers[]`);
    }
    if (!card.inhibitors || typeof card.inhibitors !== 'object') {
      errors.push(`${file}: ${card.id} needs inhibitors{}`);
    }
    if (typeof card.halfLife !== 'number' || card.halfLife <= 0) {
      errors.push(`${file}: ${card.id} needs positive halfLife`);
    }
    if (typeof card.bioavailability !== 'number' || card.bioavailability < 0 || card.bioavailability > 1) {
      errors.push(`${file}: ${card.id} bad bioavailability`);
    }
    if (!Number.isInteger(card.effectLine) || card.effectLine < 1) {
      errors.push(`${file}: ${card.id} bad effectLine`);
    }
    if (typeof card.concentrationPerDose !== 'number' || card.concentrationPerDose <= 0) {
      errors.push(`${file}: ${card.id} bad concentrationPerDose`);
    }
    if (!Array.isArray(card.concentrationEffects) || card.concentrationEffects.length === 0) {
      errors.push(`${file}: ${card.id} needs concentrationEffects[]`);
    }
    for (const effect of card.concentrationEffects ?? []) {
      if (!['g', 'mg', 'mcg'].includes(effect.unit)) {
        errors.push(`${file}: ${card.id} effect ${effect.name} bad unit`);
      }
      if (!['positive', 'negative', 'neutral'].includes(effect.valence)) {
        errors.push(`${file}: ${card.id} effect ${effect.name} bad valence`);
      }
      if (!['light', 'medium', 'heavy'].includes(effect.severity)) {
        errors.push(`${file}: ${card.id} effect ${effect.name} bad severity`);
      }
      const min = effect.severity === 'heavy' ? 6 : effect.severity === 'medium' ? 3 : 1;
      if (typeof effect.weight !== 'number' || effect.weight < min) {
        errors.push(`${file}: ${card.id} effect ${effect.name} weight below ${effect.severity}`);
      }
      if (typeof effect.threshold !== 'number' || effect.threshold <= 0) {
        errors.push(`${file}: ${card.id} effect ${effect.name} bad threshold`);
      }
    }
  }
}

const battleIds = new Set();
for (const { file, value } of battles) {
  const list = Array.isArray(value) ? value : [];
  for (const battle of list) {
    if (!battle.id || !battle.opponent || !battle.ending) {
      errors.push(`${file}: battle needs id, opponent, ending`);
    }
    if (battleIds.has(battle.id)) errors.push(`${file}: duplicate battle ${battle.id}`);
    battleIds.add(battle.id);
    if (!Array.isArray(battle.script) || battle.script.length === 0) {
      errors.push(`${file}: battle ${battle.id} has no script`);
    }
    if (battle.deckMode === 'fixed') {
      for (const id of battle.fixedHand ?? []) {
        if (!cardIds.has(id)) errors.push(`${file}: fixed hand missing card ${id}`);
      }
    }
  }
}

for (const { scene } of allScenes.values()) {
  for (const beat of scene.beats ?? []) {
    if (beat.type === 'choice') {
      for (const option of beat.options ?? []) {
        if (option.targetBattle && !battleIds.has(option.targetBattle)) {
          errors.push(`${scene.id}: missing battle ${option.targetBattle}`);
        }
      }
    }
    if (beat.type === 'battle' && !battleIds.has(beat.battleId)) {
      errors.push(`${scene.id}: missing battle ${beat.battleId}`);
    }
  }
}

const effectIds = new Set();
for (const { file, value } of effects) {
  if (!value.id || !value.title || !Array.isArray(value.blocks)) {
    errors.push(`${file}: effect needs id, title, blocks[]`);
    continue;
  }
  if (effectIds.has(value.id)) errors.push(`${file}: duplicate effect ${value.id}`);
  effectIds.add(value.id);
}

for (const { file, value } of [...chapters, ...reports, ...effects, ...cards, ...battles]) {
  const text = textOf(value);
  if (/<script|javascript:|https?:\/\//i.test(text)) {
    errors.push(`${file}: contains external URL or script tag`);
  }
  if (/<[a-z][^>]*>/i.test(text)) {
    errors.push(`${file}: contains HTML tag`);
  }
}

const sceneCount = allScenes.size;
const beatCount = [...allScenes.values()].reduce(
  (sum, item) => sum + (item.scene.beats?.length ?? 0),
  0,
);
const choiceCount = [...allScenes.values()].reduce(
  (sum, item) =>
    sum + (item.scene.beats ?? []).filter((beat) => beat.type === 'choice').length,
  0,
);
const battleCount = [...allScenes.values()].reduce(
  (sum, item) =>
    sum + (item.scene.beats ?? []).filter((beat) => beat.type === 'battle').length,
  0,
);

console.log(
  `content:check: ${sceneCount} scenes, ${beatCount} beats, ${choiceCount} choices, ${battleCount} battle beats, ${reports.length} reports, ${effects.length} effects, ${cardIds.size} drugs, ${battleIds.size} battles`,
);
if (warnings.length) {
  console.log(`warnings (${warnings.length}):`);
  warnings.forEach((warning) => console.log(`  - ${warning}`));
}
if (errors.length) {
  console.error(`errors (${errors.length}):`);
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exit(1);
}
console.log('content:check: OK');