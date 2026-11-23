import { useEffect, useRef } from 'react';
import { audio } from '../audio/AudioManager';
import { DRUG_WAR_BODY, DRUG_WAR_BUTTON, DRUG_WAR_HEADING, DRUG_WAR_TITLE } from '../content/drugWar';
import c from './CivilWarEvent.module.css';

export function CivilWarEvent({ onClose }: { onClose: () => void }) {
  const played = useRef(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (played.current) return;
    played.current = true;
    audio.playCue('drug-war', { restart: true, fadeMs: 150 });
    buttonRef.current?.focus();
  }, []);

  return (
    <div className={c.overlay} data-testid="civil-war-event" data-cue="drug-war">
      <div
        className={c.backdrop}
        aria-hidden="true"
      />
      <section
        className={c.paper}
        role="dialog"
        aria-modal="true"
        aria-labelledby="civil-war-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
      >
        <div className={c.bleed} aria-hidden="true" />
        <header className={c.masthead}>
          <span className={c.issue}>紧急事故 · 第 1 号</span>
          <span className={c.war}>{DRUG_WAR_TITLE}</span>
          <span className={c.date}>二〇二四年六月二十九日</span>
        </header>
        <h2 id="civil-war-title" className={c.title}>{DRUG_WAR_HEADING}</h2>
        <div className={c.body}>
          {DRUG_WAR_BODY.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <div className={c.footer}>
          <span className={c.credit}>曲：When Johnny Comes Marching Home</span>
          <button ref={buttonRef} type="button" className={c.button} onClick={onClose} data-testid="civil-war-close">
            {DRUG_WAR_BUTTON}
          </button>
        </div>
      </section>
    </div>
  );
}
