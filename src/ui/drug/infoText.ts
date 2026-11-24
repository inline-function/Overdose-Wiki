import { getLocale } from '../../i18n';
import {
  CLASS_TEXT_EN,
  EFFECT_TEXT_EN,
  ENZYME_TEXT_EN,
  INFO_FALLBACK_EN,
  NEURO_TEXT_EN,
  TAG_TEXT_EN,
} from './infoText.en';
export type InfoKind = 'tag' | 'neuro' | 'enzyme' | 'effect' | 'class';

const TAG_TEXT: Record<string, string> = {
  兴奋剂: '提高警觉、心率与行动感；重复使用容易带来耐受与反跳。',
  镇静剂: '压低中枢兴奋度，带来放松与困倦；与呼吸抑制叠加时风险更高。',
  抗抑郁药: '用于调整情绪相关递质；起效慢，过量时副作用会先出现。',
  抗焦虑药: '降低焦虑与警觉；长期使用后停药可能出现反跳。',
  解离剂: '切断感知与认知的连接；剂量越高，身体与环境的距离越远。',
  阿片类: '镇痛与欣快，同时压低呼吸；耐受与依赖来得很快。',
  苯二氮卓类药品: '增强 GABA 抑制，带来镇静、抗焦虑与遗忘。',
  抗组胺: '压低组胺能觉醒与过敏反应；过量时抗胆碱能明显。',
  抗精神病药: '压低多巴胺等兴奋系统；镇静与代谢负担常见。',
  抗癫痫药: '降低异常放电与过度兴奋；断药可能反跳。',
  镇咳药: '压低咳嗽反射；部分药物在高剂量下产生解离。',
  催眠剂: '缩短入睡时间；会改变睡眠结构与记忆。',
  镇痛药: '降低痛觉传递；不同机制的镇痛药副作用差别很大。',
  抗胆碱能剂: '阻断乙酰胆碱；带来口干、发热、谵妄与尿潴留。',
  '选择性血清素再摄取抑制剂': '提高突触间隙血清素；起效慢，过量可能走向血清素综合征。',
  '血清素去甲肾上腺素再摄取抑制剂': '同时提高血清素与去甲肾上腺素；停药反应明显。',
  '去甲肾上腺素多巴胺再摄取抑制剂': '提高去甲肾上腺素与多巴胺；带兴奋与减食欲作用。',
  'NMDA 拮抗剂': '阻断 NMDA 受体，产生解离型麻醉与认知改变。',
  'NMDA 激动剂': '增强谷氨酸传递，可能反制解离，也可能带来兴奋性毒性。',
  植物成分: '来自植物或提取物；成分复杂，杂质与剂量不易控制。',
  其他: '未归入上述标签；仍按药品档案的机制理解。',
};

const NEURO_TEXT: Record<string, string> = {
  血清素: '情绪、睡眠、食欲与体温调节；过高时可能触发血清素综合征。',
  多巴胺: '奖励、动机、运动与注意力；过高时带来激越与精神病样体验。',
  去甲肾上腺素: '警觉、心率、血压与应激反应；过高时心悸、震颤、焦虑。',
  谷氨酸: '中枢主要兴奋递质；NMDA 受体被拮抗时产生解离。',
  GABA: '中枢主要抑制递质；增强时镇静、抗焦虑，过量会压住呼吸。',
  乙酰胆碱: '记忆、肌肉收缩与分泌；被阻断时口干、谵妄、尿潴留。',
  组胺: '觉醒、过敏与胃酸；被阻断时困倦与镇静。',
  内啡肽: '内源性镇痛与欣快；阿片受体被激动时呼吸抑制。',
};

const ENZYME_TEXT: Record<string, string> = {
  CYP1A2: '咖啡因等物质的代谢酶；被抑制时作用时间延长。',
  CYP2A6: '尼古丁等物质的代谢酶；个体差异较大。',
  CYP2B6: '部分精神药物与阿片类的代谢酶。',
  CYP2C8: '部分镇痛药与降糖药的代谢酶。',
  CYP2C9: '华法林、部分抗癫痫药的代谢酶。',
  CYP2C19: '部分抗抑郁药与质子泵抑制剂的代谢酶。',
  CYP2D6: '许多精神药物与右美沙芬的代谢酶；抑制后血药浓度升高。',
  CYP2E1: '乙醇等小分子物质的代谢酶；长期饮酒会诱导它。',
  CYP3A4: '最常见的药物代谢酶之一；葡萄柚汁等会抑制它。',
  CYP3A5: '与 CYP3A4 重叠的代谢酶；表达存在个体差异。',
  'MAO-A': '分解血清素与去甲肾上腺素；被抑制时这些递质升高。',
  'MAO-B': '主要分解多巴胺；被抑制时多巴胺作用延长。',
};

const EFFECT_TEXT: Record<string, string> = {
  解离: '感知与认知断开：身体变轻、环境变远、时间变慢。轻为漂浮感，中为身体不属于自己，重为完全断开。',
  欣快: '短期的轻松与愉悦；通常伴随耐受，之后是反跳。',
  镇静: '动作与思维变慢，困倦；与呼吸抑制叠加时危险。',
  呼吸抑制: '呼吸变浅变慢；重度会缺氧、昏迷。',
  谵妄: '急性精神错乱：时间空间定向力下降，可能出现影子人与被害妄想。',
  抗胆碱能: '口干、发热、心跳快、意识混浊、尿潴留。',
  血清素综合征: '血清素过载：发热、震颤、反射亢进、意识改变。',
  戒断: '停药后的反跳：焦虑、失眠、疼痛、抑郁，严重时可能危及生命。',
  耐受: '同样的剂量不再产生同样效果，促使继续加量。',
  激越: '坐立不安、易怒、心跳快，难以静止。',
};

const CLASS_TEXT: Record<string, string> = {
  other: '其他：不按处方药/精神药品分类归档。',
  otc: 'OTC：非处方药，仍可能有明显精神作用。',
  rx: 'Rx：处方药，需要医生评估。',
  c2: '精二：第二类精神药品，绿色/白色四格标识。',
  c1: '精一：第一类精神药品，深绿色/白色四格标识。',
  narcotic: '麻：麻醉药品，蓝色方块内标“麻”。',
};

export function infoText(kind: InfoKind, key: string): string {
  if (getLocale() === 'en') {
    if (kind === 'tag') return TAG_TEXT_EN[key] ?? INFO_FALLBACK_EN.tag(key);
    if (kind === 'neuro') return NEURO_TEXT_EN[key] ?? INFO_FALLBACK_EN.neuro(key);
    if (kind === 'enzyme') return ENZYME_TEXT_EN[key] ?? INFO_FALLBACK_EN.enzyme(key);
    if (kind === 'effect') return EFFECT_TEXT_EN[key] ?? INFO_FALLBACK_EN.effect(key);
    return CLASS_TEXT_EN[key] ?? key;
  }
  if (kind === 'tag') return TAG_TEXT[key] ?? `标签：${key}。`;
  if (kind === 'neuro') return NEURO_TEXT[key] ?? `神经递质：${key}。`;
  if (kind === 'enzyme') return ENZYME_TEXT[key] ?? `酶：${key}。`;
  if (kind === 'effect') return EFFECT_TEXT[key] ?? `效应：${key}。`;
  return CLASS_TEXT[key] ?? key;
}