// 春风剧情大立绘：整身共享 rig 动画 + 按情绪调色的星头熔岩/日冕 FX。
// 所有差分共用这一套动画（一套 rig × N 皮肤），无需逐套绑骨骼。
import { HARUKAZE_EXPR_HEAD } from '../dlc/harukazeExpr';
import s from './HarukazeBust.module.css';

const MOOD_COLOR: Record<string, { color: string; hot: string }> = {
  calm: { color: '#a62b20', hot: '#f0c866' },
  smile: { color: '#d9a441', hot: '#f3ead8' },
  intense: { color: '#e8793a', hot: '#fff3d0' },
  tired: { color: '#721a14', hot: '#a62b20' },
  sad: { color: '#2f4f8f', hot: '#8fa8b8' },
  restless: { color: '#9c4f5e', hot: '#d98f9b' },
  blank: { color: '#8c8270', hot: '#d6ccb4' },
  hurt: { color: '#721a14', hot: '#a62b20' },
};

function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

export function HarukazeBust({ mood, heightU }: { mood: string; heightU: number }) {
  const m = MOOD_COLOR[mood] ? mood : 'calm';
  const { color, hot } = MOOD_COLOR[m];
  const head = HARUKAZE_EXPR_HEAD[m] ?? { x: 64, y: 34 };
  // 128x192 源坐标 → 百分比定位 FX
  const rGlow = 20; const rLava = 13;
  const pct = (cx: number, cy: number, r: number) => ({
    left: `${((cx - r) / 128) * 100}%`,
    top: `${((cy - r) / 192) * 100}%`,
    width: `${((2 * r) / 128) * 100}%`,
    height: `${((2 * r) / 192) * 100}%`,
  });
  const widthU = (heightU * 128) / 192;
  return (
    <div
      className={s.bust}
      style={{ height: `calc(${heightU} * var(--u))`, width: `calc(${widthU} * var(--u))`, ['--star-color' as string]: color, ['--star-hot' as string]: hot }}
      data-mood={m}
    >
      <div className={s.rig}>
        <img className={s.img} src={asset(`assets/props/prop_harukaze_${m}.png`)} alt="" />
        <div className={s.glow} style={pct(head.x, head.y, rGlow)} />
        <div className={s.lava} style={pct(head.x, head.y, rLava)} />
      </div>
    </div>
  );
}
