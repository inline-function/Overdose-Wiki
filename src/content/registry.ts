import {
  battles,
  cards,
  drugs,
  chapterLoaders,
  effectLoaders,
  extraStoryLoaders,
  isPrivate,
  manifest,
  reportLoaders,
} from './generated';
import type {
  Battle,
  Card,
  Chapter,
  DrugEntry,
  ChapterMeta,
  Effect,
  ExtraStory,
  ExtraStoryMeta,
  Report,
  ReportMeta,
  ReportSegmentMeta,
  Scene,
  SceneMeta,
} from './types';

const chapterMetaMap = new Map(manifest.chapters.map((chapter) => [chapter.id, chapter]));
const reportMetaMap = new Map(
  manifest.reports.map((report) => [normalizeReportId(report.id), report]),
);
const extraMetaMap = new Map<string, ExtraStoryMeta>(
  manifest.extras.map((story) => [story.id, story]),
);
const effectMetaMap = new Map(manifest.effects.map((effect) => [effect.id, effect]));
const sceneMetaMap = new Map<string, SceneMeta>();
for (const chapter of manifest.chapters) {
  for (const scene of chapter.scenes) sceneMetaMap.set(scene.id, scene);
}
const cardMap = new Map(cards.map((card) => [card.id, card]));
const battleMap = new Map(battles.map((battle) => [battle.id, battle]));
const drugMap = new Map(drugs.map((drug) => [drug.id, drug]));

const chapterCache = new Map<string, Promise<Chapter | undefined>>();
const reportCache = new Map<string, Promise<Report | undefined>>();
const extraStoryCache = new Map<string, Promise<ExtraStory | undefined>>();
const sceneCache = new Map<string, Promise<Scene | undefined>>();
const effectCache = new Map<string, Promise<Effect | undefined>>();

export function normalizeReportId(id: string): string {
  if (/^\d+$/.test(id)) return String(Number(id));
  return id;
}

export function hasContent(): boolean {
  return isPrivate;
}

export function getManifest() {
  return manifest;
}

export function getChapterMetas(): ChapterMeta[] {
  return manifest.chapters;
}

export function getChapterMeta(id: string): ChapterMeta | undefined {
  return chapterMetaMap.get(id);
}

export function getSceneMeta(id: string): SceneMeta | undefined {
  return sceneMetaMap.get(id);
}

export function getReportMetas(): ReportMeta[] {
  return manifest.reports;
}

export function getReportMeta(id: string): ReportMeta | undefined {
  return reportMetaMap.get(normalizeReportId(id));
}

export function getExtraStoryMetas(): ExtraStoryMeta[] {
  return manifest.extras;
}

export function getExtraStoryMeta(id: string): ExtraStoryMeta | undefined {
  return extraMetaMap.get(id);
}

export function getEffectMetas() {
  return manifest.effects;
}

export function getEffectMeta(id: string) {
  return effectMetaMap.get(id);
}

export function getCards(): Card[] {
  return cards;
}

export function getCard(id: string): Card | undefined {
  return cardMap.get(id);
}

export function getDrugs(): DrugEntry[] {
  return drugs;
}

export function getDrug(id: string): DrugEntry | undefined {
  return drugMap.get(id);
}

export function getBattle(id: string): Battle | undefined {
  return battleMap.get(id);
}

const EMPTY_CHAPTER = Promise.resolve(undefined);

export function chapterPromise(id?: string): Promise<Chapter | undefined> {
  if (!id) return EMPTY_CHAPTER;
  const cached = chapterCache.get(id);
  if (cached) return cached;
  const loader = chapterLoaders[id];
  const promise = loader
    ? loader().catch(() => undefined)
    : Promise.resolve(undefined);
  chapterCache.set(id, promise);
  return promise;
}

export function reportPromise(id: string): Promise<Report | undefined> {
  const normalized = normalizeReportId(id);
  const cached = reportCache.get(normalized);
  if (cached) return cached;
  const loader = reportLoaders[normalized];
  const promise = loader
    ? loader().catch(() => undefined)
    : Promise.resolve(undefined);
  reportCache.set(normalized, promise);
  return promise;
}

export function scenePromise(sceneId: string): Promise<Scene | undefined> {
  const cached = sceneCache.get(sceneId);
  if (cached) return cached;
  const meta = getSceneMeta(sceneId);
  const promise = meta
    ? chapterPromise(meta.chapterId).then((chapter) =>
        chapter?.scenes.find((scene) => scene.id === sceneId),
      )
    : Promise.resolve(undefined);
  sceneCache.set(sceneId, promise);
  return promise;
}

export function extraStoryPromise(id: string): Promise<ExtraStory | undefined> {
  const cached = extraStoryCache.get(id);
  if (cached) return cached;
  const loader = extraStoryLoaders[id];
  const promise = loader
    ? loader().catch(() => undefined)
    : Promise.resolve(undefined);
  extraStoryCache.set(id, promise);
  return promise;
}

export function effectPromise(id: string): Promise<Effect | undefined> {
  const cached = effectCache.get(id);
  if (cached) return cached;
  const loader = effectLoaders[id];
  const promise = loader
    ? loader().catch(() => undefined)
    : Promise.resolve(undefined);
  effectCache.set(id, promise);
  return promise;
}

export function findSegmentForScene(
  reportId: string,
  sceneId: string,
): ReportSegmentMeta | undefined {
  return getReportMeta(reportId)?.segments.find((segment) => segment.sceneId === sceneId);
}

export function segmentForScene(
  reportId: string,
  sceneId: string,
): ReportSegmentMeta | undefined {
  const direct = findSegmentForScene(reportId, sceneId);
  if (direct) return direct;
  const scene = getSceneMeta(sceneId);
  if (!scene?.reportSegment) return undefined;
  return getReportMeta(reportId)?.segments.find(
    (segment) => segment.id === scene.reportSegment,
  );
}

export function segmentsForScene(
  sceneId: string,
): Array<{ reportId: string; segment: ReportSegmentMeta }> {
  const found: Array<{ reportId: string; segment: ReportSegmentMeta }> = [];
  for (const report of manifest.reports) {
    for (const segment of report.segments) {
      if (segment.sceneId === sceneId) {
        found.push({ reportId: report.id, segment });
      }
    }
  }
  return found;
}

export function firstSceneId(): string | undefined {
  return manifest.chapters[0]?.firstScene;
}