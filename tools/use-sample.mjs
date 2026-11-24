import { writeFile } from 'node:fs/promises';

await writeFile(
  'src/content/generated.ts',
  `import type {
  Battle,
  Card,
  Chapter,
  ContentManifest,
  DrugEntry,
  Effect,
  ExtraStory,
  ExtraStoryMeta,
  EffectMeta,
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

const CLASS_LABEL = { other: '其他', otc: 'OTC', rx: 'Rx', c2: '精二', c1: '精一', narcotic: '麻' };
function toCard(entry: DrugEntry): Card {
  return { id: entry.id, drugId: entry.id, name: entry.name, cost: 1, klass: entry.klass, category: CLASS_LABEL[entry.klass], targets: entry.card.targets, summary: entry.summary, tags: entry.tags, proper: entry.card.proper, over: entry.card.over, course: entry.card.course, storyOnly: entry.card.storyOnly };
}

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
export const enDrugs: Record<string, DrugText> = {};

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
console.log('content: generated.ts now uses sample fallback.');