import { useLocation, useNavigate } from 'react-router-dom';
import { CONSENT_VERSION } from '../game/types';
import { useGameStore } from '../game/store';
import { useSessionStore } from '../game/sessionStore';
import { consentSections } from '../game/consentText';
import { useLocale, useT } from '../i18n';
import p from './pages.module.css';

export function ConsentPage() {
  const save = useGameStore((state) => state.save);
  const acceptConsent = useGameStore((state) => state.acceptConsent);
  const session = useSessionStore((state) => state.session);
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();
  const sections = consentSections(useLocale());
  const accepted = save.consent.version >= CONSENT_VERSION;
  const from = (location.state as { from?: string } | null)?.from;

  function enter() {
    if (!accepted) acceptConsent();
    const target = [from, session.pendingFrom].find(
      (value) => value && value !== '/consent' && value !== '/login' && value !== '/welcome',
    );
    navigate(target ?? '/', { replace: true });
  }

  return (
    <section className={p.consentWrap}>
      <div className={p.consentCard}>
        <p className={p.kicker}>{t('consent.kicker')}</p>
        <h1>{t('consent.heading')}</h1>
        {sections.map((section) => (
          <section key={section.title} className={p.consentSection}>
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
        <div className={p.consentActions}>
          <button
            type="button"
            className={`${p.pixelButton} ${p.primary}`}
            style={{ width: 'calc(72 * var(--u))' }}
            onClick={enter}
          >
            {t(accepted ? 'consent.enter' : 'consent.acceptAndEnter')}
          </button>
          <button
            type="button"
            className={`${p.pixelButton} ${p.ghost}`}
            onClick={() => navigate('/settings')}
          >
            {t('consent.settings')}
          </button>
        </div>
        <p className={p.versionLine}>
          {t('consent.versionLine', {
            version: CONSENT_VERSION,
            state: t(accepted ? 'consent.stateAccepted' : 'consent.statePending'),
          })}
        </p>
      </div>
    </section>
  );
}