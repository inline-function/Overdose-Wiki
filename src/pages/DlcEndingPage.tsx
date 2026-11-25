import { useNavigate } from 'react-router-dom';
import { useLocale, useT } from '../i18n';
import { STAGES } from '../dlc/content';
import { pick } from '../dlc/format';
import { useDlcStore } from '../dlc/store';
import s from './Dlc.module.css';

export function DlcEndingPage() {
  const tr = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const save = useDlcStore((st) => st.save);
  return (
    <div className={`${s.root} ${s.ending}`}>
      <div className={s.bg} style={{ backgroundImage: `url(${import.meta.env.BASE_URL}assets-private/bg/bg_dlc_nebula.png)` }} />
      <div className={s.bgTint} />
      <div className={s.vignette} />
      <img className={s.endingHero} src={`${import.meta.env.BASE_URL}assets-private/dlc/harukaze_student.png`} alt={tr('dlc.statusPlayer')} />
      <div className={s.endingTitle}>{tr('dlc.title')}</div>
      <div className={s.endingSymptoms}>
        {STAGES.map((stage, i) => (
          <span key={stage.id} className={s.endingSymptom} style={{ animationDelay: `${i * 220}ms` }}>{pick(stage.title, locale)}</span>
        ))}
      </div>
      <div className={s.endingLine}>{tr('dlc.endingLine')}</div>
      <div className={s.endingStat}>{save.battleWins.length} / 8</div>
      <button type="button" className={s.pixelBtn} data-variant="amber" onClick={() => navigate('/')}>{tr('dlc.endingHome')}</button>
    </div>
  );
}
