// DLC 封面展示页：仿《在漫长岁月之后》cover，点「进入战役」时播开场再进战役。
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import { useDlcStore } from '../dlc/store';
import { ChapterOpening } from '../openings/ChapterOpening';
import { CANVAS_OPENINGS } from '../openings/registry';
import s from './Dlc.module.css';

function asset(path: string): string { return `${import.meta.env.BASE_URL}${path}`; }
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

export function DlcCoverPage() {
  const tr = useT();
  const navigate = useNavigate();
  const save = useDlcStore((st) => st.save);
  const markIntroSeen = useDlcStore((st) => st.markIntroSeen);
  const [opening, setOpening] = useState<'enter' | 'replay' | null>(null);

  const enter = () => {
    if (!save.seenIntro && !prefersReducedMotion()) setOpening('enter');
    else navigate('/dlc');
  };
  const replay = () => { if (!prefersReducedMotion()) setOpening('replay'); };

  if (opening) {
    return (
      <div className={s.root}>
        <ChapterOpening
          opening={CANVAS_OPENINGS.dlc}
          onDone={() => {
            if (opening === 'enter') { markIntroSeen(); navigate('/dlc'); }
            else setOpening(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className={s.root}>
      <div className={s.cover}>
        <img className={s.coverHero} src={asset('assets/dlc/entry_hero.png')} alt="" decoding="async" />
        <div className={s.coverShade} aria-hidden="true" />
        <div className={s.coverScan} aria-hidden="true" />
        <div className={s.coverCopy}>
          <p className={s.coverEyebrow}>{tr('dlc.coverEyebrow')}</p>
          <h1 className={s.coverTitle} data-text={tr('dlc.title')}>{tr('dlc.title')}</h1>
          <p className={s.coverSubtitle}>{tr('dlc.coverSubtitle')}</p>
          <p className={s.coverBlurb}>{tr('dlc.coverBlurb')}</p>
          <button type="button" className={s.coverEnter} onClick={enter}>
            <span>{tr('dlc.coverEnter')}</span>
            <span aria-hidden="true">→</span>
          </button>
          <button type="button" className={s.pixelBtn} data-variant="dark" onClick={() => navigate('/dlc/endless')}>{tr('dlc.endless')}</button>
          <button type="button" className={s.replayBtn} onClick={replay}>{tr('dlc.replayOpening')}</button>
        </div>
        <button type="button" className={`${s.pixelBtn} ${s.coverBack}`} data-variant="dark" onClick={() => navigate('/')}>×</button>
      </div>
    </div>
  );
}
