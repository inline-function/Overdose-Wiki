import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../../game/focus';
import { useSessionStore } from '../../game/sessionStore';
import { useConsentStore } from '../../game/consentStore';
import { useGameStore } from '../../game/store';
import { consentSections } from '../../game/consentText';
import { useLocale, useT } from '../../i18n';
import g from './gates.module.css';

export function ConsentGate() {
  const acceptConsent = useGameStore((state) => state.acceptConsent);
  const session = useSessionStore((state) => state.session);
  const acceptNotice = useConsentStore((state) => state.accept);
  const navigate = useNavigate();
  const location = useLocation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const sections = consentSections(useLocale());
  useFocusTrap(true, dialogRef);

  function enter() {
    acceptConsent();
    acceptNotice();
    const from = (location.state as { from?: string } | null)?.from;
    const target = [from, session.pendingFrom].find(
      (value) => value && value !== '/consent' && value !== '/login' && value !== '/welcome',
    );
    navigate(target ?? '/', { replace: true });
  }

  return (
    <div className={g.consentStage} data-testid="consent-gate">
      <div
        className={g.consentWindow}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
      >
        <div className={g.consentTitle}>
          <span id="consent-title">{t('gate.consentTitle')}</span>
          <span className={g.loginClose} aria-hidden="true">
            ×
          </span>
        </div>
        <div className={g.consentHeading}>
          <strong>{t('gate.consentHeading')}</strong>
          <span>{t('gate.consentByline')}</span>
        </div>
        <div
          className={g.consentBody}
          tabIndex={0}
          role="region"
          aria-label={t('gate.consentBodyLabel')}
        >
          {sections.map((section) => (
            <section key={section.title} className={g.consentSection}>
              <h2>{section.title}</h2>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className={g.consentActions}>
          <button type="button" className={g.consentButton} onClick={enter}>
            {t('consent.acceptAndEnter')}
          </button>
          <button
            type="button"
            className={g.consentSecondary}
            onClick={() => navigate('/settings')}
          >
            {t('consent.settings')}
          </button>
        </div>
      </div>
    </div>
  );
}