import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../../game/focus';
import { useSessionStore } from '../../game/sessionStore';
import { useConsentStore } from '../../game/consentStore';
import { useGameStore } from '../../game/store';
import { CONSENT_SECTIONS } from '../../game/consentText';
import g from './gates.module.css';

export function ConsentGate() {
  const acceptConsent = useGameStore((state) => state.acceptConsent);
  const session = useSessionStore((state) => state.session);
  const acceptNotice = useConsentStore((state) => state.accept);
  const navigate = useNavigate();
  const location = useLocation();
  const dialogRef = useRef<HTMLDivElement>(null);
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
          <span id="consent-title">ODW // 事先声明 v2</span>
          <span className={g.loginClose} aria-hidden="true">
            ×
          </span>
        </div>
        <div className={g.consentHeading}>
          <strong>在被记录之前</strong>
          <span>站长：后藤 · 请先读完再进入</span>
        </div>
        <div className={g.consentBody} tabIndex={0} role="region" aria-label="事先声明正文">
          {CONSENT_SECTIONS.map((section) => (
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
            同意并进入
          </button>
          <button
            type="button"
            className={g.consentSecondary}
            onClick={() => navigate('/settings')}
          >
            设置
          </button>
        </div>
      </div>
    </div>
  );
}