import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale, useT } from '../i18n';
import { BATTLE_MAP, STAGES } from '../dlc/content';
import { pick } from '../dlc/format';
import { useDlcStore } from '../dlc/store';
import { ChapterOpening } from '../openings/ChapterOpening';
import { CANVAS_OPENINGS } from '../openings/registry';
import s from './Dlc.module.css';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

function asset(path: string): string { return `${import.meta.env.BASE_URL}${path}`; }

export function DlcCampaignPage() {
  const tr = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const save = useDlcStore((st) => st.save);
  const markIntroSeen = useDlcStore((st) => st.markIntroSeen);
  const current = STAGES[Math.min(7, Math.max(0, save.stage - 1))];
  const [showOpening, setShowOpening] = useState(() => !save.seenIntro && !prefersReducedMotion());

  return (
    <div className={`${s.root} ${s.campaign}`}>
      <div className={s.bg} style={{ backgroundImage: `url(${asset('assets-private/bg/bg_dlc_summer_street_wide.png')})` }} />
      <div className={s.bgTint} />
      <div className={s.vignette} />
      <div className={s.campaignHead}>
        <div>
          <div className={s.campaignKicker}>{tr('dlc.kicker')}</div>
          <div className={s.campaignTitle}>{tr('dlc.title')}</div>
        </div>
        <div className={s.shopActions}>
          <span className={s.sideMeta}>{tr('dlc.currency')} {save.currency}</span>
          <button type="button" className={s.pixelBtn} data-variant="dark" onClick={() => navigate('/dlc/shop')}>{tr('dlc.shop')}</button>
          <button type="button" className={s.pixelBtn} data-variant="dark" onClick={() => navigate('/')}>×</button>
        </div>
      </div>
      <div className={s.campaignBody}>
        <div className={s.pathMap}>
          {STAGES.map((stage) => {
            const done = save.completed.includes(stage.id);
            const isCurrent = stage.no === save.stage;
            const locked = stage.no > save.stage;
            const state = done ? 'done' : isCurrent ? 'current' : 'locked';
            const battle = BATTLE_MAP[stage.battleId];
            return (
              <button
                key={stage.id}
                type="button"
                className={s.node}
                data-state={state}
                disabled={locked}
                onClick={() => navigate(`/dlc/battle?stage=${stage.no}`)}
                aria-label={pick(stage.title, locale)}
              >
                <img className={s.nodeIcon} src={asset(`assets-private/dlc/${battle.portrait}.png`)} alt="" />
                <span className={s.nodeNo}>{tr('dlc.stageNo', { no: String(stage.no) })}</span>
                <span className={s.nodeTitle}>{pick(stage.title, locale)}</span>
                {done && <span className={s.nodeStamp}>✓ {tr('dlc.completed')}</span>}
                {isCurrent && !done && <span className={s.nodeStamp} style={{ color: 'var(--c-yellow)' }}>{tr('dlc.current')}</span>}
              </button>
            );
          })}
        </div>
        <div className={s.campaignSide}>
          <div className={s.sideTitle}>{pick(current.title, locale)}</div>
          <div className={s.sideBlurb}>{pick(current.blurb, locale)}</div>
          <div className={s.sideMeta}>{tr('dlc.deck')} {save.deck.length}/12</div>
          <button type="button" className={s.pixelBtn} data-variant="amber" onClick={() => navigate(`/dlc/battle?stage=${save.stage}`)}>{tr('dlc.fight')}</button>
        </div>
      </div>
      {showOpening && (
        <ChapterOpening
          opening={CANVAS_OPENINGS.dlc}
          onDone={() => { markIntroSeen(); setShowOpening(false); }}
        />
      )}
    </div>
  );
}
