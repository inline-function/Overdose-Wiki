import { getLocale } from '../../i18n';
import { enDrugs } from '../../content/generated';
import type { Card, DrugClass, DrugEntry } from '../../content/types';

/** Display-only English for drug data. Mechanical ids (status names, tags used as
 *  info keys) stay Chinese in the data; these maps translate the labels only. */

const TAG_LABELS_EN: Record<string, string> = {
  '抗组胺': 'Antihistamine',
  '镇静剂': 'Sedative',
  '其他': 'Other',
  '兴奋剂': 'Stimulant',
  '植物成分': 'Plant-derived',
  '黄嘌呤类': 'Xanthine',
  '抗解离剂': 'Anti-dissociative',
  '镁补充剂': 'Magnesium supplement',
  OTC: 'OTC',
  '质子泵抑制剂': 'Proton-pump inhibitor',
  '催眠剂': 'Hypnotic',
  '抗病毒药': 'Antiviral',
  '谵妄剂': 'Deliriant',
  '解离剂': 'Dissociative',
  '抗痴呆药': 'Anti-dementia',
  '镇痛药': 'Analgesic',
  '抗胆碱能剂': 'Anticholinergic',
  SSRI: 'SSRI',
  '五朵金花': 'Five golden flowers',
  SNRI: 'SNRI',
  '抗抑郁药': 'Antidepressant',
  NDRI: 'NDRI',
  '非典型抗精神病药': 'Atypical antipsychotic',
  '拮抗剂': 'Antagonist',
  '阿片类拮抗剂': 'Opioid antagonist',
  '苯二氮卓拮抗剂': 'Benzodiazepine antagonist',
  '阿片类药品': 'Opioid',
  '抗癫痫药': 'Antiepileptic',
  '抗精神病药': 'Antipsychotic',
  '心境稳定剂': 'Mood stabiliser',
  '镇咳药': 'Cough suppressant',
  '抗焦虑药': 'Anxiolytic',
  '苯二氮卓类药品': 'Benzodiazepine',
  '迷幻剂': 'Psychedelic',
  '梦境增强剂': 'Dream enhancer',
  '注意力缺陷治疗药': 'ADHD medication',
  '觉醒促进剂': 'Wakefulness promoter',
  '现实检验': 'Reality check',
};

const EFFECT_LABELS_EN: Record<string, string> = {
  '镇静': 'Sedation',
  '呼吸抑制': 'Respiratory depression',
  '欣快': 'Euphoria',
  '激越': 'Agitation',
  '抗胆碱能': 'Anticholinergic',
  '谵妄': 'Delirium',
  '解离': 'Dissociation',
  '血清素综合征': 'Serotonin syndrome',
  '戒断': 'Withdrawal',
};

const NEURO_LABELS_EN: Record<string, string> = {
  GABA: 'GABA',
  '内啡肽': 'Endorphins',
  '多巴胺': 'Dopamine',
  '去甲肾上腺素': 'Noradrenaline',
  '谷氨酸': 'Glutamate',
  '组胺': 'Histamine',
  '血清素': 'Serotonin',
};

const COURSE_LABELS_EN: Record<string, string> = {
  'SSRI 疗程': 'SSRI course',
  'SNRI 疗程': 'SNRI course',
  '苯二氮卓疗程': 'Benzodiazepine course',
  '阿片类疗程': 'Opioid course',
};

const CLASS_LABELS_EN: Record<DrugClass, string> = {
  other: 'Other',
  otc: 'OTC',
  rx: 'Rx',
  c2: 'Sch. II',
  c1: 'Sch. I',
  narcotic: 'Narcotic',
};

const CLASS_ARIA_EN: Record<DrugClass, string> = {
  other: 'Other',
  otc: 'Over the counter',
  rx: 'Prescription only',
  c2: 'Second-class psychotropic',
  c1: 'First-class psychotropic',
  narcotic: 'Narcotic',
};

export function drugClassLabel(klass: DrugClass): string {
  return getLocale() === 'en' ? CLASS_LABELS_EN[klass] : CLASS_LABELS_ZH[klass];
}

export function drugClassAria(klass: DrugClass): string {
  return getLocale() === 'en' ? CLASS_ARIA_EN[klass] : CLASS_ARIA_ZH[klass];
}

const CLASS_LABELS_ZH: Record<DrugClass, string> = {
  other: '其他',
  otc: 'OTC',
  rx: 'Rx',
  c2: '精二',
  c1: '精一',
  narcotic: '麻',
};

const CLASS_ARIA_ZH: Record<DrugClass, string> = {
  other: '其他',
  otc: '非处方药',
  rx: '处方药',
  c2: '第二类精神药品',
  c1: '第一类精神药品',
  narcotic: '麻醉药品',
};

export function tagLabel(tag: string): string {
  return getLocale() === 'en' ? (TAG_LABELS_EN[tag] ?? tag) : tag;
}

export function effectLabel(name: string): string {
  return getLocale() === 'en' ? (EFFECT_LABELS_EN[name] ?? name) : name;
}

export const statusLabel = effectLabel;

export function neuroLabel(name: string): string {
  return getLocale() === 'en' ? (NEURO_LABELS_EN[name] ?? name) : name;
}

export function courseLabel(name: string): string {
  return getLocale() === 'en' ? (COURSE_LABELS_EN[name] ?? name) : name;
}

export function drugTextOf(drug: DrugEntry) {
  return getLocale() === 'en' ? enDrugs[drug.id] : undefined;
}

export function drugName(drug: DrugEntry): string {
  return drugTextOf(drug)?.name ?? drug.name;
}

export function drugAliases(drug: DrugEntry): string[] {
  return drugTextOf(drug)?.aliases ?? drug.aliases;
}

export function drugSummary(drug: DrugEntry): string {
  return drugTextOf(drug)?.summary ?? drug.summary;
}

export function drugDescription(drug: DrugEntry): string {
  return drugTextOf(drug)?.description ?? drug.description;
}

export function drugWithdrawalLog(drug: DrugEntry): string | undefined {
  return drugTextOf(drug)?.withdrawalLog ?? drug.withdrawal?.log;
}

export function drugClassNote(drug: DrugEntry): string | undefined {
  return drugTextOf(drug)?.classNote ?? drug.classNote;
}

export function drugCourseName(drug: DrugEntry): string | undefined {
  return drug.card.course ? courseLabel(drug.card.course.name) : undefined;
}

/* Card display (deck, boxes) carries a copy of the drug text from the generator. */
export function cardName(card: Card): string {
  return getLocale() === 'en' ? (enDrugs[card.drugId]?.name ?? card.name) : card.name;
}

export function cardSummary(card: Card): string {
  return getLocale() === 'en' ? (enDrugs[card.drugId]?.summary ?? card.summary) : card.summary;
}

export function cardTags(card: Card): string[] {
  return getLocale() === 'en'
    ? (enDrugs[card.drugId]?.aliases ?? card.tags).map(tagLabel)
    : card.tags;
}
