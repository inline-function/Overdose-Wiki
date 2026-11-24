import {
  battles,
  cards,
  drugs,
  chapterLoaders,
  effectLoaders,
  enChapterOverlays,
  enEffectLoaders,
  enEffectMetas,
  enExtraStoryLoaders,
  enExtraStoryMetas,
  enReportLoaders,
  enReportMetas,
  enTitles,
  extraStoryLoaders,
  isPrivate,
  manifest,
  reportLoaders,
} from './generated';
import { getLocale } from '../i18n/locale';
import { mergeChapter } from './en/merge';
import type { ChapterOverlay } from './en/types';
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
const enEffectMetaMap = new Map(enEffectMetas.map((effect) => [effect.id, effect]));
const enExtraMetaMap = new Map(enExtraStoryMetas.map((story) => [story.id, story]));
const enReportMetaMap = new Map(
  enReportMetas.map((report) => [normalizeReportId(report.id), report]),
);
const chapterMetaEnMap = new Map(
  manifest.chapters.map((chapter) => [
    chapter.id,
    { ...chapter, title: enTitles[`chapter:${chapter.id}`] ?? chapter.title },
  ]),
);
const chapterMetasEn = [...chapterMetaEnMap.values()];
const sceneMetaEnMap = new Map<string, SceneMeta>();
for (const chapter of chapterMetasEn) {
  for (const scene of chapter.scenes) {
    sceneMetaEnMap.set(scene.id, {
      ...scene,
      title: enTitles[`scene:${scene.id}`] ?? scene.title,
    });
  }
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
  return getLocale() === 'en' ? chapterMetasEn : manifest.chapters;
}

/** Titles stay in the manifest for structure; the English ones sit in the
 *  generated title map so a missing translation falls back to Chinese. */
export function chapterTitle(id: string): string {
  return (
    (getLocale() === 'en' ? enTitles[`chapter:${id}`] : undefined) ??
    chapterMetaMap.get(id)?.title ??
    id
  );
}

export function sceneTitle(id: string): string {
  return (
    (getLocale() === 'en' ? enTitles[`scene:${id}`] : undefined) ??
    sceneMetaMap.get(id)?.title ??
    id
  );
}

export function getChapterMeta(id: string): ChapterMeta | undefined {
  return getLocale() === 'en' ? chapterMetaEnMap.get(id) : chapterMetaMap.get(id);
}

export function getSceneMeta(id: string): SceneMeta | undefined {
  return getLocale() === 'en' ? sceneMetaEnMap.get(id) : sceneMetaMap.get(id);
}

export function getReportMetas(): ReportMeta[] {
  if (getLocale() !== 'en' || enReportMetas.length === 0) return manifest.reports;
  return manifest.reports.map(
    (report) => enReportMetaMap.get(normalizeReportId(report.id)) ?? report,
  );
}

export function getReportMeta(id: string): ReportMeta | undefined {
  const normalized = normalizeReportId(id);
  if (getLocale() === 'en') {
    const translated = enReportMetaMap.get(normalized);
    if (translated) return translated;
  }
  return reportMetaMap.get(normalized);
}

export function getExtraStoryMetas(): ExtraStoryMeta[] {
  if (getLocale() !== 'en' || enExtraStoryMetas.length === 0) return manifest.extras;
  return manifest.extras.map((story) => enExtraMetaMap.get(story.id) ?? story);
}

export function getExtraStoryMeta(id: string): ExtraStoryMeta | undefined {
  if (getLocale() === 'en') {
    const translated = enExtraMetaMap.get(id);
    if (translated) return translated;
  }
  return extraMetaMap.get(id);
}

export function getEffectMetas() {
  if (getLocale() !== 'en' || enEffectMetas.length === 0) return manifest.effects;
  return manifest.effects.map((effect) => enEffectMetaMap.get(effect.id) ?? effect);
}

export function getEffectMeta(id: string) {
  if (getLocale() === 'en') {
    const translated = enEffectMetaMap.get(id);
    if (translated) return translated;
  }
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
  const locale = getLocale();
  const key = `${locale}:${id}`;
  const cached = chapterCache.get(key);
  if (cached) return cached;
  const loader = chapterLoaders[id];
  const overlay = locale === 'en' ? enChapterOverlays[id] : undefined;
  const promise = loader
    ? loader()
        .then(async (chapter) => {
          if (!overlay) return chapter;
          try {
            const module = await overlay();
            return mergeChapter(chapter, module as ChapterOverlay);
          } catch {
            return chapter;
          }
        })
        .catch(() => undefined)
    : Promise.resolve(undefined);
  chapterCache.set(key, promise);
  return promise;
}

export function reportPromise(id: string): Promise<Report | undefined> {
  const normalized = normalizeReportId(id);
  const locale = getLocale();
  const key = `${locale}:${normalized}`;
  const cached = reportCache.get(key);
  if (cached) return cached;
  const loader =
    locale === 'en' ? (enReportLoaders[normalized] ?? reportLoaders[normalized]) : reportLoaders[normalized];
  const promise = loader
    ? loader().catch(() => undefined)
    : Promise.resolve(undefined);
  reportCache.set(key, promise);
  return promise;
}

export function scenePromise(sceneId: string): Promise<Scene | undefined> {
  const key = `${getLocale()}:${sceneId}`;
  const cached = sceneCache.get(key);
  if (cached) return cached;
  const meta = getSceneMeta(sceneId);
  const promise = meta
    ? chapterPromise(meta.chapterId).then((chapter) =>
        chapter?.scenes.find((scene) => scene.id === sceneId),
      )
    : Promise.resolve(undefined);
  sceneCache.set(key, promise);
  return promise;
}

export function extraStoryPromise(id: string): Promise<ExtraStory | undefined> {
  const key = `${getLocale()}:${id}`;
  const cached = extraStoryCache.get(key);
  if (cached) return cached;
  const loader =
    getLocale() === 'en' ? (enExtraStoryLoaders[id] ?? extraStoryLoaders[id]) : extraStoryLoaders[id];
  const promise = loader
    ? loader().catch(() => undefined)
    : Promise.resolve(undefined);
  extraStoryCache.set(key, promise);
  return promise;
}

export function effectPromise(id: string): Promise<Effect | undefined> {
  const key = `${getLocale()}:${id}`;
  const cached = effectCache.get(key);
  if (cached) return cached;
  const loader =
    getLocale() === 'en' ? (enEffectLoaders[id] ?? effectLoaders[id]) : effectLoaders[id];
  const promise = loader
    ? loader().catch(() => undefined)
    : Promise.resolve(undefined);
  effectCache.set(key, promise);
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