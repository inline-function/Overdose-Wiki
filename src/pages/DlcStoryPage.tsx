// DLC 独立剧情渲染器：自包含视觉小说 runner，复用 HarukazeBust 动画立绘。
// 不走主线 ReplayPage / content registry。
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale, useT } from '../i18n';
import { HarukazeBust } from '../components/HarukazeBust';
import { DLC_STORY, DLC_STORY_MAP } from '../dlc/story';
import s from './Dlc.module.css';

function asset(path: string): string { return `${import.meta.env.BASE_URL}${path}`; }

export function DlcStoryPage() {
  const tr = useT();
  const locale = useLocale();
  void locale;
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const scene = (id && DLC_STORY_MAP[id]) || DLC_STORY[0];
  const [beatIndex, setBeatIndex] = useState(0);
  const beat = scene.beats[Math.min(beatIndex, scene.beats.length - 1)];

  // 表情/背景沿用上一拍，直到被显式切换
  const { mood, bg } = useMemo(() => {
    let m = 'calm'; let b = scene.bg;
    for (let i = 0; i <= beatIndex && i < scene.beats.length; i += 1) {
      if (scene.beats[i].expr) m = scene.beats[i].expr!;
      if (scene.beats[i].bg) b = scene.beats[i].bg!;
    }
    return { mood: m, bg: b };
  }, [beatIndex, scene]);

  const advance = () => {
    if (beatIndex < scene.beats.length - 1) setBeatIndex((i) => i + 1);
    else navigate('/dlc');
  };

  const speaker = beat.speaker ?? tr('dlc.narrator');

  return (
    <div className={s.root} onClick={advance} data-testid="dlc-story">
      <div className={s.bg} style={{ backgroundImage: `url(${asset(`assets-private/bg/${bg}.png`)})` }} />
      <div className={s.bgTint} />
      <div className={s.vignette} />
      <div className={s.storyHead}>
        <span className={s.storyTitle}>{tr('dlc.storyTitle')} · {scene.title}</span>
        <button type="button" className={s.pixelBtn} data-variant="dark" onClick={(e) => { e.stopPropagation(); navigate('/dlc'); }}>×</button>
      </div>
      <div className={s.storyBust}>
        <HarukazeBust mood={mood} heightU={180} />
      </div>
      <div className={s.storyDialog}>
        <div className={s.storySpeaker}>{speaker}</div>
        <div className={s.storyText}>{beat.text}</div>
        <div className={s.storyHint}>{tr('dlc.storyContinue')} ▸</div>
      </div>
    </div>
  );
}
