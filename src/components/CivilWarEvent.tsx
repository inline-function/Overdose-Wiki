import { useEffect, useRef } from 'react';
import { audio } from '../audio/AudioManager';
import { drugWarText } from '../content/drugWar';
import { useT } from '../i18n';
import c from './CivilWarEvent.module.css';

export function CivilWarEvent({ onClose }: { onClose: () => void }) {
  const tr = useT();
  const war = drugWarText();
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
          <span className={c.issue}>{tr('civilWar.issue')}</span>
          <span className={c.war}>{war.title}</span>
          <span className={c.date}>{tr('civilWar.date')}</span>
        </header>
        <h2 id="civil-war-title" className={c.title}>{war.heading}</h2>
        <div className={c.body}>
          {war.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <div className={c.footer}>
          <span className={c.credit}>{tr('civilWar.credit')}</span>
          <button ref={buttonRef} type="button" className={c.button} onClick={onClose} data-testid="civil-war-close">
            {war.button}
          </button>
        </div>
      </section>
    </div>
  );
}
