import type { AnalysisCase, AnalysisCaseMeta } from './types';

/**
 * 精神分析案例放在私有大包的 analysis/ 目录；没有私有大包时是空表，
 * 剧情里的 analysis 拍会显示“案例缺失”的占位。
 */
const modules = import.meta.glob<AnalysisCase>('./private/analysis/*.json', {
  eager: true,
});

const cases = new Map<string, AnalysisCase>();
for (const [path, value] of Object.entries(modules)) {
  const id = path.split('/').pop()?.replace(/\.json$/, '') ?? '';
  if (!id) continue;
  cases.set(id, { ...value, id });
}

export function analysisCases(): AnalysisCase[] {
  return [...cases.values()].sort((a, b) => a.order - b.order);
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
  return cases.get(id);
}

/** 与 chapterPromise 保持同一种调用形状，方便以后换成懒加载。 */
export function analysisPromise(id: string): Promise<AnalysisCase | undefined> {
  return Promise.resolve(cases.get(id));
}
