// DLC 文本格式化：卡牌类别、效果描述（长按详情用）。
import type { Card, Effect, LocaleText, StatusId, Tag } from './types';
import { STATUS_INFO, TAG_INFO } from './content';
import type { Locale } from '../i18n/types';

export function pick(text: LocaleText, locale: Locale): string {
  return locale === 'en' ? text.en : text.zh;
}

const CATEGORY: Record<string, LocaleText> = {
  harm: { zh: '减害药', en: 'Harm Reduction' },
  serotonin: { zh: '血清素能剂', en: 'Serotonergic' },
  opioid: { zh: '阿片类药品', en: 'Opioid' },
  anticholinergic: { zh: '抗胆碱能', en: 'Anticholinergic' },
  dopamine: { zh: '多巴胺能剂', en: 'Dopaminergic' },
  stimulant: { zh: '兴奋剂', en: 'Stimulant' },
  dissociative: { zh: '解离剂', en: 'Dissociative' },
  analgesic: { zh: '镇痛辅助', en: 'Analgesic Adjunct' },
  supplement: { zh: '补剂', en: 'Supplement' },
  sedative: { zh: '镇静催眠药', en: 'Sedative-Hypnotic' },
};

/** 由 tags 推导牌面类别（10 类，见设计留档）。 */
export function categoryOf(card: Card): LocaleText {
  const has = (tag: Tag) => card.tags.includes(tag);
  if (has('harm')) return CATEGORY.harm;
  if (has('serotonin')) return CATEGORY.serotonin;
  if (has('respiratory') && has('analgesia')) return CATEGORY.opioid;
  if (has('delirium')) return CATEGORY.anticholinergic;
  if (has('dopamine')) return CATEGORY.dopamine;
  if (has('motivation')) return CATEGORY.stimulant;
  if (has('dissociation')) return CATEGORY.dissociative;
  if (has('analgesia')) return CATEGORY.analgesic;
  if (has('nutrition')) return CATEGORY.supplement;
  return CATEGORY.sedative;
}

export function tagLabel(tag: Tag, locale: Locale): string {
  return pick(TAG_INFO[tag], locale);
}

export function statusLabel(status: StatusId, locale: Locale): string {
  return pick(STATUS_INFO[status].label, locale);
}

const TRACK: Record<'phys' | 'mental', LocaleText> = {
  phys: { zh: '生理', en: 'physical' },
  mental: { zh: '心理', en: 'mental' },
};

/** 单条效果的可读文本；状态名在 UI 里渲染为超链接。 */
export function effectText(effect: Effect, locale: Locale): string {
  const zh = locale !== 'en';
  switch (effect.kind) {
    case 'damage':
      return zh
        ? `造成 ${effect.amount} 点${TRACK[effect.track].zh}伤害`
        : `Deal ${effect.amount} ${TRACK[effect.track].en} damage`;
    case 'heal':
      return zh
        ? `恢复 ${effect.amount} 点${TRACK[effect.track].zh}`
        : `Restore ${effect.amount} ${TRACK[effect.track].en}`;
    case 'status': {
      const label = statusLabel(effect.status, locale);
      const base = zh ? `附着 ${label} +${effect.amount}` : `Apply ${label} +${effect.amount}`;
      if (effect.percent) {
        return zh
          ? `${base}（另加当前层数的 ${Math.round(effect.percent * 100)}%）`
          : `${base} (plus ${Math.round(effect.percent * 100)}% of current)`;
      }
      return base;
    }
    case 'ap':
      return zh ? `行动点 +${effect.amount}` : `AP +${effect.amount}`;
    case 'clear': {
      const label = statusLabel(effect.status, locale);
      return zh ? `清除 ${label}` : `Clear ${label}`;
    }
  }
}

export function cardEffectLines(card: Card, locale: Locale): string[] {
  return card.effects.map((effect) => effectText(effect, locale));
}

/** 效果里涉及的状态 id（详情面板超链接用）。 */
export function effectStatuses(card: Card): StatusId[] {
  const out: StatusId[] = [];
  for (const effect of card.effects) {
    if (effect.kind === 'status' || effect.kind === 'clear') out.push(effect.status);
  }
  return [...new Set(out)];
}
