// DLC 封面展示页：仿《在漫长岁月之后》cover，点进入才正式进战役。
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n';
import s from './Dlc.module.css';

function asset(path: string): string { return `${import.meta.env.BASE_URL}${path}`; }

export function DlcCoverPage() {
  const tr = useT();
  const navigate = useNavigate();
  return (
    <div className={s.root}>
      <div className={s.cover}>
        <img className={s.coverHero} src={asset('assets/dlc/entry_hero.png')} alt="" decoding="async" />
        <div className={s.coverShade} aria-hidden="true" />
        <div className={s.coverCopy}>
          <p className={s.coverEyebrow}>{tr('dlc.coverEyebrow')}</p>
          <h1 className={s.coverTitle}>{tr('dlc.title')}</h1>
          <p className={s.coverSubtitle}>{tr('dlc.coverSubtitle')}</p>
          <p className={s.coverBlurb}>{tr('dlc.coverBlurb')}</p>
          <button type="button" className={s.coverEnter} onClick={() => navigate('/dlc')}>
            <span>{tr('dlc.coverEnter')}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <button type="button" className={`${s.pixelBtn} ${s.coverBack}`} data-variant="dark" onClick={() => navigate('/')}>×</button>
      </div>
    </div>
  );
}
