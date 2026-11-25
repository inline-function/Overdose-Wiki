// DLC 卡牌类别与状态的像素风 SVG 图标（描边式，currentColor）。
import type { ReactNode } from 'react';
import type { StatusId, Tag } from './types';

type IconProps = { className?: string };

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'miter' as const,
  shapeRendering: 'crispEdges' as const,
};

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...S}>
      {children}
    </svg>
  );
}

// 血清素：上升的分子链
export function SerotoninIcon(p: IconProps) {
  return <Svg {...p}><circle cx="6" cy="16" r="2.5" /><circle cx="12" cy="9" r="2.5" /><circle cx="18" cy="15" r="2.5" /><path d="M8 14l2.5-3M14 11l2.5 2.5" /><path d="M12 3v2" /></Svg>;
}
// 阿片：罂粟蒴果
export function OpioidIcon(p: IconProps) {
  return <Svg {...p}><path d="M12 21v-8" /><circle cx="12" cy="8" r="5" /><path d="M9 6l1.5 2M15 6l-1.5 2M12 4v3" /></Svg>;
}
// 镇痛辅助：盾牌
export function AnalgesicIcon(p: IconProps) {
  return <Svg {...p}><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M9 11l2 2 4-4" /></Svg>;
}
// 补剂：叶与滴
export function SupplementIcon(p: IconProps) {
  return <Svg {...p}><path d="M5 19c0-8 6-13 14-14-1 8-6 14-14 14z" /><path d="M5 19c4-4 8-7 11-9" /></Svg>;
}
// 镇静催眠：月与 z
export function SedativeIcon(p: IconProps) {
  return <Svg {...p}><path d="M15 4a7 7 0 1 0 5 12 8 8 0 0 1-5-12z" /><path d="M17 5h4l-4 4h4" /></Svg>;
}
// 兴奋剂：闪电
export function StimulantIcon(p: IconProps) {
  return <Svg {...p}><path d="M13 2L5 13h5l-1 9 8-11h-5z" /></Svg>;
}
// 解离：分离的方框
export function DissociativeIcon(p: IconProps) {
  return <Svg {...p}><rect x="3" y="3" width="8" height="8" /><rect x="13" y="13" width="8" height="8" /><path d="M11 7h4M7 11v4" strokeDasharray="2 2" /></Svg>;
}
// 抗胆碱能：阻断的钥匙
export function AnticholinergicIcon(p: IconProps) {
  return <Svg {...p}><circle cx="8" cy="8" r="4" /><path d="M11 11l9 9M17 17l2-2M14 14l2-2" /><path d="M3 21l4-4" /></Svg>;
}
// 多巴胺：奖赏星
export function DopamineIcon(p: IconProps) {
  return <Svg {...p}><path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" /></Svg>;
}
// 减害：心与十字
export function HarmIcon(p: IconProps) {
  return <Svg {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /><path d="M12 8v5M9.5 10.5h5" /></Svg>;
}

export function categoryIcon(tag: Tag | 'opioid' | 'sedative' | 'stimulant' | 'dissociative' | 'anticholinergic' | 'analgesic' | 'supplement' | 'harm' | 'dopamine' | 'serotonin') {
  switch (tag) {
    case 'serotonin': return SerotoninIcon;
    case 'opioid': return OpioidIcon;
    case 'analgesic': return AnalgesicIcon;
    case 'supplement': return SupplementIcon;
    case 'sedative': return SedativeIcon;
    case 'stimulant': return StimulantIcon;
    case 'dissociative': return DissociativeIcon;
    case 'anticholinergic': return AnticholinergicIcon;
    case 'dopamine': return DopamineIcon;
    case 'harm': return HarmIcon;
    default: return SupplementIcon;
  }
}

/** 类别 key（与 format.categoryOf 的 CATEGORY key 对齐）。 */
export function categoryKey(tags: Tag[]): string {
  const has = (t: Tag) => tags.includes(t);
  if (has('harm')) return 'harm';
  if (has('serotonin')) return 'serotonin';
  if (has('respiratory') && has('analgesia')) return 'opioid';
  if (has('delirium')) return 'anticholinergic';
  if (has('dopamine')) return 'dopamine';
  if (has('motivation')) return 'stimulant';
  if (has('dissociation')) return 'dissociative';
  if (has('analgesia')) return 'analgesic';
  if (has('nutrition')) return 'supplement';
  return 'sedative';
}

export function StatusIcon({ status, className }: { status: StatusId; className?: string }) {
  switch (status) {
    case 'serotonin': return <SerotoninIcon className={className} />;
    case 'sedation': return <SedativeIcon className={className} />;
    case 'respiratory': return <OpioidIcon className={className} />;
    case 'delirium': return <AnticholinergicIcon className={className} />;
    case 'dissociation': return <DissociativeIcon className={className} />;
    case 'counter': return <StimulantIcon className={className} />;
    case 'analgesia': return <AnalgesicIcon className={className} />;
    case 'painkiller': return <HarmIcon className={className} />;
  }
}
