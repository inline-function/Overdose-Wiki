import { getLocale } from '../i18n';
import type { AnalysisCase, AnalysisCaseMeta } from './types';

/**
 * 精神分析案例放在私有大包的 analysis/ 目录；没有私有大包时是空表，
 * 剧情里的 analysis 拍会显示“案例缺失”的占位。
 */
const modules = import.meta.glob<AnalysisCase>('./private/analysis/*.json', {
  eager: true,
});
const enModules = import.meta.glob<Record<string, unknown>>('./private/en/analysis/*.json', {
  eager: true,
});

type EnCase = {
  title?: string;
  subtitle?: string;
  intro?: string;
  report?: { title?: string; paragraphs?: string[] };
  keywordTexts?: string[];
  blocks?: Record<string, string>;
  slots?: Record<string, string>;
  reveal?: { quote?: string; paragraphs?: string[] };
  restore?: { text?: string; annotation?: string };
};

const enCases = new Map<string, EnCase>();
for (const [path, value] of Object.entries(enModules)) {
  const id = path.split('/').pop()?.replace(/\.json$/, '') ?? '';
  if (!id) continue;
  const entry = (value as { [id: string]: EnCase })[id] ?? (value as EnCase);
  enCases.set(id, entry);
}

const cases = new Map<string, AnalysisCase>();
for (const [path, value] of Object.entries(modules)) {
  const id = path.split('/').pop()?.replace(/\.json$/, '') ?? '';
  if (!id) continue;
  cases.set(id, { ...value, id });
}

function localized(base: AnalysisCase): AnalysisCase {
  if (getLocale() !== 'en') return base;
  const en = enCases.get(base.id);
  if (!en) return base;
  return {
    ...base,
    title: en.title ?? base.title,
    subtitle: en.subtitle ?? base.subtitle,
    intro: en.intro ?? base.intro,
    report: {
      ...base.report,
      title: en.report?.title ?? base.report.title,
      paragraphs: en.report?.paragraphs ?? base.report.paragraphs,
    },
    keywords: base.keywords.map((keyword, index) => ({
      ...keyword,
      text: en.keywordTexts?.[index] ?? keyword.text,
    })),
    blocks: base.blocks.map((block) => ({
      ...block,
      text: en.blocks?.[block.id] ?? block.text,
    })),
    slots: base.slots.map((slot) => ({
      ...slot,
      hint: en.slots?.[slot.id] ?? slot.hint,
    })),
    reveal: {
      ...base.reveal,
      quote: en.reveal?.quote ?? base.reveal.quote,
      paragraphs: en.reveal?.paragraphs ?? base.reveal.paragraphs,
    },
    restore: {
      ...base.restore,
      text: en.restore?.text ?? base.restore.text,
      annotation: en.restore?.annotation ?? base.restore.annotation,
    },
  };
}

export function analysisCases(): AnalysisCase[] {
  return [...cases.values()].map(localized).sort((a, b) => a.order - b.order);
}

export function analysisMetas(): AnalysisCaseMeta[] {
  return analysisCases().map((item) => ({
    id: item.id,
    order: item.order,
    title: item.title,
    subtitle: item.subtitle,
  }));
}

export function getAnalysisCase(id: string): AnalysisCase | undefined {
  const base = cases.get(id);
  return base ? localized(base) : undefined;
}

/** 与 chapterPromise 保持同一种调用形状，方便以后换成懒加载。 */
export function analysisPromise(id: string): Promise<AnalysisCase | undefined> {
  return Promise.resolve(getAnalysisCase(id));
}
