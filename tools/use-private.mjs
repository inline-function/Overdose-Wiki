import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CHAPTERS = 'src/content/private/chapters';
const REPORTS = 'src/content/private/reports';
const EFFECTS = 'src/content/private/effects';
const EXTRAS = 'src/content/private/extras';
const DRUGS = 'src/content/private/drugs.json';
const OUT = 'src/content/generated.ts';

async function files(dir) {
  try {
    return (await readdir(dir)).filter((name) => name.endsWith('.json')).sort();
  } catch {
    return [];
  }
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function writeSampleFallback() {
  await writeFile(
    OUT,
    `import type {
  Battle,
  Card,
  Chapter,
  ContentManifest,
  DrugEntry,
  Effect,
  ExtraStory,
  Report,
  ReportMeta,
} from './types';
import {
  SAMPLE_BATTLES,
  SAMPLE_CHAPTER,
  SAMPLE_DRUGS,
  SAMPLE_REPORT_DATA,
} from './sample';

export const isPrivate = false;

export const manifest: ContentManifest = {
  chapters: [
    {
      id: SAMPLE_CHAPTER.id,
      title: SAMPLE_CHAPTER.title,
      sceneCount: SAMPLE_CHAPTER.scenes.length,
      firstScene: SAMPLE_CHAPTER.scenes[0].id,
      scenes: SAMPLE_CHAPTER.scenes.map((scene) => ({
        id: scene.id,
        chapterId: SAMPLE_CHAPTER.id,
        title: scene.title,
        ...(scene.reportId ? { reportId: scene.reportId } : {}),
        ...(scene.reportSegment ? { reportSegment: scene.reportSegment } : {}),
      })),
    },
  ],
  reports: [
    {
      id: SAMPLE_REPORT_DATA.id,
      no: SAMPLE_REPORT_DATA.no,
      title: SAMPLE_REPORT_DATA.title,
      reporter: SAMPLE_REPORT_DATA.reporter,
      edited: SAMPLE_REPORT_DATA.edited,
      segments: SAMPLE_REPORT_DATA.segments.map((segment) => ({
        id: segment.id,
        label: segment.label,
        ...(segment.sceneId ? { sceneId: segment.sceneId } : {}),
      })),
    },
  ],
  effects: [],
  extras: [],
};

export const drugs: DrugEntry[] = SAMPLE_DRUGS;
export const cards: Card[] = SAMPLE_DRUGS.map(toCard);
export const battles: Battle[] = SAMPLE_BATTLES;

export const chapterLoaders: Record<string, () => Promise<Chapter>> = {
  [SAMPLE_CHAPTER.id]: async () => SAMPLE_CHAPTER,
};
export const reportLoaders: Record<string, () => Promise<Report>> = {
  [SAMPLE_REPORT_DATA.id]: async () => SAMPLE_REPORT_DATA,
};
export const effectLoaders: Record<string, () => Promise<Effect>> = {};
export const extraStoryLoaders: Record<string, () => Promise<ExtraStory>> = {};

export const enChapterOverlays: Record<string, () => Promise<unknown>> = {};
export const enReportLoaders: Record<string, () => Promise<Report>> = {};
export const enReportMetas: ReportMeta[] = [];
export const enReportOverlays: Record<string, () => Promise<unknown>> = {};
export const enEffectLoaders: Record<string, () => Promise<Effect>> = {};
export const enEffectMetas: EffectMeta[] = [];
export const enExtraStoryLoaders: Record<string, () => Promise<ExtraStory>> = {};
export const enExtraStoryMetas: ExtraStoryMeta[] = [];
export const enTitles: Record<string, string> = {};
`,
    'utf8',
  );
  console.log('content: no private JSON; generated.ts now uses sample fallback.');
}

const chapterFiles = await files(CHAPTERS);
const reportFiles = await files(REPORTS);
const effectFiles = await files(EFFECTS);
const extraFiles = await files(EXTRAS);
const hasDrugs = existsSync(DRUGS);
const hasBattles = existsSync('src/content/private/battles.json');

if (
  !chapterFiles.length &&
  !reportFiles.length &&
  !effectFiles.length &&
  !extraFiles.length &&
  !hasDrugs
) {
  await writeSampleFallback();
  process.exit(0);
}

const chapters = [];
for (const file of chapterFiles) {
  chapters.push({ file, value: await readJson(path.join(CHAPTERS, file)) });
}
const reports = [];
for (const file of reportFiles) {
  reports.push({ file, value: await readJson(path.join(REPORTS, file)) });
}
const effects = [];
for (const file of effectFiles) {
  effects.push({ file, value: await readJson(path.join(EFFECTS, file)) });
}
const extras = [];
for (const file of extraFiles) {
  extras.push({ file, value: await readJson(path.join(EXTRAS, file)) });
}
const drugs = hasDrugs ? await readJson(DRUGS) : [];

// English overlays live beside the Chinese sources. They only carry translated
// text; the structure stays in the Chinese file, so the two can never drift.
const EN = 'src/content/private/en';
const enChapters = [];
for (const file of await files(`${EN}/chapters`)) {
  enChapters.push({ file, value: await readJson(path.join(EN, 'chapters', file)) });
}
const enReports = [];
for (const file of await files(`${EN}/reports`)) {
  enReports.push({ file, value: await readJson(path.join(EN, 'reports', file)) });
}
const enEffects = [];
for (const file of await files(`${EN}/effects`)) {
  enEffects.push({ file, value: await readJson(path.join(EN, 'effects', file)) });
}
const enExtras = [];
for (const file of await files(`${EN}/extras`)) {
  enExtras.push({ file, value: await readJson(path.join(EN, 'extras', file)) });
}
let enDrugs = {};
try {
  enDrugs = await readJson(path.join(EN, 'drugs.json'));
} catch {
  enDrugs = {};
}
const enTitles = {};
for (const { file, value } of enChapters) {
  const id = file.replace(/\.json$/, '');
  if (value.title) enTitles[`chapter:${id}`] = value.title;
  for (const [sceneId, scene] of Object.entries(value.scenes ?? {})) {
    if (scene && typeof scene === 'object' && scene.title) enTitles[`scene:${sceneId}`] = scene.title;
  }
}

const manifest = {
  chapters: chapters.map(({ value }) => ({
    id: value.id,
    title: value.title,
    sceneCount: value.scenes.length,
    firstScene: value.scenes[0]?.id ?? '',
    scenes: value.scenes.map((scene) => ({
      id: scene.id,
      chapterId: value.id,
      title: scene.title,
      ...(scene.reportId ? { reportId: scene.reportId } : {}),
      ...(scene.reportSegment ? { reportSegment: scene.reportSegment } : {}),
    })),
  })),
  reports: reports.map(({ value }) => ({
    id: value.id,
    no: value.no,
    title: value.title,
    reporter: value.reporter,
    edited: value.edited,
    ...(value.unlock ? { unlock: value.unlock } : {}),
    segments: value.segments.map((segment) => ({
      id: segment.id,
      label: segment.label,
      ...(segment.sceneId ? { sceneId: segment.sceneId } : {}),
    })),
  })),
  effects: effects.map(({ value }) => ({
    id: value.id,
    title: value.title,
    tags: value.tags,
  })),
  extras: extras.map(({ value }) => ({
    id: value.id,
    title: value.title,
    kind: value.kind,
    date: value.date,
    summary: value.summary,
  })),
};

const lines = [
  "import type { Battle, Card, Chapter, ContentManifest, DrugEntry, DrugText, Effect, EffectMeta, ExtraStory, ExtraStoryMeta, Report, ReportMeta } from './types';",
  '',
  '// Generated by tools/use-private.mjs. Do not commit private imports.',
];
if (hasDrugs) lines.push("import drugsData from './private/drugs.json';");
if (hasBattles) lines.push("import battlesData from './private/battles.json';");
lines.push('');
lines.push('export const isPrivate = true;');
lines.push(
  "const CLASS_LABEL = { other: '其他', otc: 'OTC', rx: 'Rx', c2: '精二', c1: '精一', narcotic: '麻' };",
);
lines.push(
  'function toCard(entry: DrugEntry): Card { return { id: entry.id, drugId: entry.id, name: entry.name, cost: 1, klass: entry.klass, category: CLASS_LABEL[entry.klass], targets: entry.card.targets, summary: entry.summary, tags: entry.tags, effectLine: entry.effectLine, concentrationEffects: entry.concentrationEffects, proper: entry.card.proper, over: entry.card.over, course: entry.card.course, storyOnly: entry.card.storyOnly }; }',
);
lines.push(`export const manifest: ContentManifest = ${JSON.stringify(manifest, null, 2)};`);
lines.push('');
lines.push(`export const drugs: DrugEntry[] = ${hasDrugs ? '(drugsData as unknown as DrugEntry[])' : '[]'};`);
lines.push(`export const cards: Card[] = drugs.filter((entry) => entry.card).map(toCard);`);
lines.push(`export const battles: Battle[] = ${hasBattles ? '(battlesData as unknown as Battle[])' : '[]'};`);
if (Object.keys(enDrugs).length) {
  lines.push("import enDrugsData from './private/en/drugs.json';");
}
lines.push(
  `export const enDrugs: Record<string, DrugText> = ${Object.keys(enDrugs).length ? '(enDrugsData as unknown as Record<string, DrugText>)' : '{}'};`,
);
lines.push('');
lines.push('export const chapterLoaders: Record<string, () => Promise<Chapter>> = {');
for (const { file, value } of chapters) {
  lines.push(
    `  ${JSON.stringify(value.id)}: () => import('./private/chapters/${file}').then((m) => m.default as unknown as Chapter),`,
  );
}
lines.push('};');
lines.push('');
lines.push('export const reportLoaders: Record<string, () => Promise<Report>> = {');
for (const { file, value } of reports) {
  lines.push(
    `  ${JSON.stringify(value.id)}: () => import('./private/reports/${file}').then((m) => m.default as unknown as Report),`,
  );
}
lines.push('};');
lines.push('');
lines.push('export const effectLoaders: Record<string, () => Promise<Effect>> = {');
for (const { file, value } of effects) {
  lines.push(
    `  ${JSON.stringify(value.id)}: () => import('./private/effects/${file}').then((m) => m.default as unknown as Effect),`,
  );
}
lines.push('};');
lines.push('');
lines.push('export const extraStoryLoaders: Record<string, () => Promise<ExtraStory>> = {');
for (const { file, value } of extras) {
  lines.push(
    `  ${JSON.stringify(value.id)}: () => import('./private/extras/${file}').then((m) => m.default as unknown as ExtraStory),`,
  );
}
lines.push('};');
lines.push('');
lines.push('export const enChapterOverlays: Record<string, () => Promise<unknown>> = {');
for (const { file } of enChapters) {
  const id = file.replace(/\.json$/, '');
  lines.push(
    `  ${JSON.stringify(id)}: () => import('./private/en/chapters/${file}').then((m) => m.default as unknown),`,
  );
}
lines.push('};');
lines.push('');
lines.push('export const enReportLoaders: Record<string, () => Promise<Report>> = {');
for (const { file, value } of enReports) {
  lines.push(
    `  ${JSON.stringify(value.id)}: () => import('./private/en/reports/${file}').then((m) => m.default as unknown as Report),`,
  );
}
lines.push('};');
lines.push('');
const enReportMetas = enReports.map(({ value }) => ({
  id: value.id,
  no: value.no,
  title: value.title,
  reporter: value.reporter,
  edited: value.edited,
  ...(value.unlock ? { unlock: value.unlock } : {}),
  segments: value.segments.map((segment) => ({
    id: segment.id,
    label: segment.label,
    ...(segment.sceneId ? { sceneId: segment.sceneId } : {}),
  })),
}));
lines.push(`export const enReportMetas: ReportMeta[] = ${JSON.stringify(enReportMetas, null, 2)};`);
lines.push('');
lines.push('export const enEffectLoaders: Record<string, () => Promise<Effect>> = {');
for (const { file, value } of enEffects) {
  lines.push(
    `  ${JSON.stringify(value.id)}: () => import('./private/en/effects/${file}').then((m) => m.default as unknown as Effect),`,
  );
}
lines.push('};');
lines.push('');
const enEffectMetas = enEffects.map(({ value }) => ({
  id: value.id,
  title: value.title,
  tags: value.tags ?? [],
}));
lines.push(`export const enEffectMetas: EffectMeta[] = ${JSON.stringify(enEffectMetas, null, 2)};`);
lines.push('');
lines.push('export const enExtraStoryLoaders: Record<string, () => Promise<ExtraStory>> = {');
for (const { file, value } of enExtras) {
  lines.push(
    `  ${JSON.stringify(value.id)}: () => import('./private/en/extras/${file}').then((m) => m.default as unknown as ExtraStory),`,
  );
}
lines.push('};');
lines.push('');
const enExtraMetas = enExtras.map(({ value }) => ({
  id: value.id,
  title: value.title,
  kind: value.kind,
  date: value.date,
  summary: value.summary,
}));
lines.push(`export const enExtraStoryMetas: ExtraStoryMeta[] = ${JSON.stringify(enExtraMetas, null, 2)};`);
lines.push('');
lines.push(`export const enTitles: Record<string, string> = ${JSON.stringify(enTitles, null, 2)};`);
lines.push('');

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${lines.join('\n')}\n`, 'utf8');
console.log(
  `content: selected ${chapters.length} chapter(s), ${reports.length} report(s), ${effects.length} effect(s), ${extras.length} extra(s), ${hasDrugs ? `${drugs.length} drug(s)` : 'no drugs'}, ${hasBattles ? 'battles' : 'no battles'}.`,
);