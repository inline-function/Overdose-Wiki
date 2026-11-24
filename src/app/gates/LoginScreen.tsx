import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../../game/focus';
import { useSessionStore } from '../../game/sessionStore';
import { useConsentStore } from '../../game/consentStore';
import { useGameStore } from '../../game/store';
import { gateAudio } from '../../audio/gateAudio';
import { CONSENT_VERSION } from '../../game/types';
import { useLocale, useT } from '../../i18n';
import {
  PASSWORD_TYPED,
  USERNAME_TYPED,
  buildPassword,
  buildUsername,
  maskPassword,
  nextCount,
} from '../../game/tokenFill';
import g from './gates.module.css';

type Field = 'username' | 'password';
type Status = 'idle' | 'checking' | 'success';

export function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();
  const locale = useLocale();
  const setSettings = useGameStore((state) => state.setSettings);
  const session = useSessionStore((state) => state.session);
  const consentVersion = useGameStore((state) => state.save.consent.version);
  const consentAccepted = useConsentStore((state) => state.accepted);
  const patch = useSessionStore((state) => state.patch);
  const dialogRef = useRef<HTMLDivElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const loginRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const [coarse] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  const [userCount, setUserCount] = useState(0);
  const [passCount, setPassCount] = useState(0);
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [note, setNote] = useState('');
  const from = (location.state as { from?: string } | null)?.from;

  useFocusTrap(true, dialogRef);

  useEffect(() => {
    if (!coarse) usernameRef.current?.focus({ preventScroll: true });
    if (gateAudio.unlocked) gateAudio.loginOpen();
  }, [coarse]);

  useEffect(() => {
    if (from && from !== '/login' && !session.pendingFrom) patch({ pendingFrom: from });
  }, [from, patch, session.pendingFrom]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const username = buildUsername(userCount);
  const password = buildPassword(passCount);
  const masked = maskPassword(password, show);
  const userPlaceholder = coarse ? t('gate.usernamePlaceholder') : '';
  const passPlaceholder = coarse ? t('gate.passwordPlaceholder') : '';
  const complete = userCount === USERNAME_TYPED && passCount === PASSWORD_TYPED;

  function announce(message: string) {
    setNote(message);
  }

  function advance(field: Field) {
    if (status !== 'idle') return;
    if (field === 'username') {
      const next = nextCount(userCount, USERNAME_TYPED);
      setUserCount(next);
      if (next >= USERNAME_TYPED) {
        announce(t('gate.filledUsername'));
        passwordRef.current?.focus({ preventScroll: true });
      }
    } else {
      const next = nextCount(passCount, PASSWORD_TYPED);
      setPassCount(next);
      if (next >= PASSWORD_TYPED) {
        announce(t('gate.filledPassword'));
        loginRef.current?.focus({ preventScroll: true });
      }
    }
  }

  function fill(field: Field) {
    if (status !== 'idle') return;
    if (field === 'username') {
      setUserCount(USERNAME_TYPED);
      announce(t('gate.autoFilledUsername'));
      passwordRef.current?.focus({ preventScroll: true });
    } else {
      setPassCount(PASSWORD_TYPED);
      announce(t('gate.autoFilledPassword'));
      loginRef.current?.focus({ preventScroll: true });
    }
  }

  function submit() {
    if (status !== 'idle') return;
    if (userCount < USERNAME_TYPED) {
      fill('username');
      return;
    }
    if (passCount < PASSWORD_TYPED) {
      fill('password');
      return;
    }
    setStatus('checking');
    announce(t('gate.verifying'));
    const verify = window.setTimeout(() => {
      setStatus('success');
      gateAudio.stamp();
      patch({ loggedIn: true, loginAt: new Date().toISOString() });
      announce(t('gate.loginSuccess'));
      const target = session.pendingFrom ?? from ?? '/';
      const next = consentAccepted && consentVersion >= CONSENT_VERSION ? target : '/consent';
      const enter = window.setTimeout(() => navigate(next, { replace: true }), 480);
      timers.current.push(enter);
    }, 620);
    timers.current.push(verify);
  }

  function onKey(field: Field, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
      return;
    }
    if (event.key.length !== 1 || event.repeat) return;
    event.preventDefault();
    gateAudio.key();
    advance(field);
  }

  function onPointer(field: Field, event: PointerEvent<HTMLInputElement>) {
    if (!coarse || status !== 'idle') return;
    event.preventDefault();
    gateAudio.pop();
    fill(field);
  }

  return (
    <div className={g.loginStage} data-testid="login">
      <div
        className={g.loginWindow}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        aria-describedby="login-note"
      >
        <div className={g.loginTitle}>
          <span id="login-title">{t('gate.windowTitle')}</span>
          <span className={g.loginClose} aria-hidden="true">
            ×
          </span>
        </div>
        <div className={g.loginBody}>
          <div className={g.loginBrand}>
            <span className={g.loginLogo}>ODW</span>
            <span className={g.loginKicker}>Overdose Wiki</span>
          </div>
          <p className={g.loginWelcome}>{t('gate.welcome')}</p>

          <label className={g.field}>
            <span className={g.fieldLabel}>{t('gate.username')}</span>
            <div className={g.inputShell}>
              <input
                ref={usernameRef}
                className={g.fakeInput}
                value={username}
                placeholder={userPlaceholder}
                readOnly
                inputMode={coarse ? 'none' : 'text'}
                autoComplete="off"
                spellCheck={false}
                aria-label={coarse ? t('gate.usernameAriaCoarse') : t('gate.usernameAriaKeyboard')}
                onKeyDown={(event) => onKey('username', event)}
                onPointerDown={(event) => onPointer('username', event)}
              />
              <span className={g.inputMirror} data-empty={!username} aria-hidden="true">
                {username || userPlaceholder}
                <span className={g.caret}>_</span>
              </span>
            </div>
            </label>

          <div className={g.field}>
            <div className={g.passwordRow}>
              <span className={g.fieldLabel}>{t('gate.password')}</span>
              <button
                type="button"
                className={g.showButton}
                aria-pressed={show}
                onClick={() => setShow((value) => !value)}
              >
                {t(show ? 'gate.hide' : 'gate.show')}
              </button>
            </div>
            <div className={g.inputShell}>
              <input
                ref={passwordRef}
                className={g.fakeInput}
                value={masked}
                placeholder={passPlaceholder}
                readOnly
                inputMode={coarse ? 'none' : 'text'}
                autoComplete="off"
                spellCheck={false}
                aria-label={coarse ? t('gate.passwordAriaCoarse') : t('gate.passwordAriaKeyboard')}
                onKeyDown={(event) => onKey('password', event)}
                onPointerDown={(event) => onPointer('password', event)}
              />
              <span className={g.inputMirror} data-empty={!masked} aria-hidden="true">
                {masked || passPlaceholder}
                <span className={g.caret}>_</span>
              </span>
            </div>
            </div>

          <div className={g.loginActions}>
            <button
              ref={loginRef}
              type="button"
              className={g.loginButton}
              disabled={!complete || status !== 'idle'}
              onClick={submit}
            >
              {status === 'checking'
                ? t('gate.loggingIn')
                : status === 'success'
                  ? t('gate.loggedIn')
                  : t('gate.login')}
            </button>
            <button
              type="button"
              className={g.languageButton}
              lang={locale === 'zh' ? 'en' : 'zh-CN'}
              onClick={() => setSettings({ lang: locale === 'zh' ? 'en' : 'zh' })}
            >
              {t('gate.switchLanguage')}
            </button>
            {status === 'success' && <span className={g.loginStamp}>{t('gate.entered')}</span>}
          </div>

          <p className={g.loginNote} id="login-note" aria-live="polite">
            {note}
          </p>

          <p className={g.loginFooter}>
            <Link to="/consent">{t('gate.footerConsent')}</Link>
            <span aria-hidden="true"> · </span>
            <Link to="/settings">{t('gate.footerSettings')}</Link>
            <span aria-hidden="true"> · </span>
            {t('gate.footerArchive')}
          </p>
        </div>
      </div>
    </div>
  );
}