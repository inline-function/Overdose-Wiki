import { useLocation, useNavigate } from 'react-router-dom';
import { CONSENT_VERSION } from '../game/types';
import { useGameStore } from '../game/store';
import { useSessionStore } from '../game/sessionStore';
import { CONSENT_SECTIONS } from '../game/consentText';
import p from './pages.module.css';

export function ConsentPage() {
  const save = useGameStore((state) => state.save);
  const acceptConsent = useGameStore((state) => state.acceptConsent);
  const session = useSessionStore((state) => state.session);
  const navigate = useNavigate();
  const location = useLocation();
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
        <p className={p.kicker}>ODW // 事先声明 v1</p>
        <h1>在被记录之前</h1>
        {CONSENT_SECTIONS.map((section) => (
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
            {accepted ? '进入 ODW' : '同意并进入'}
          </button>
          <button
            type="button"
            className={`${p.pixelButton} ${p.ghost}`}
            onClick={() => navigate('/settings')}
          >
            设置
          </button>
        </div>
        <p className={p.versionLine}>
          事先声明 v{CONSENT_VERSION} · {accepted ? '已同意' : '未同意'}
        </p>
      </div>
    </section>
  );
}