import { Suspense, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { modeForPath, tabLinks } from '../game/routing';
import { AUDIO_MANIFEST } from '../audio/manifest';
import { audio } from '../audio/AudioManager';
import { gateAudio } from '../audio/gateAudio';
import { hasContent } from '../content/registry';
import { useFullscreen, useGameScale } from '../game/scale';
import { useGameStore } from '../game/store';
import { WikiWindow } from '../ui/window/WikiWindow';
import { QuestGuide } from '../ui/QuestGuide';
import { GateStage } from './gates/GateStage';
import { CONSENT_VERSION } from '../game/types';
import { useSessionStore } from '../game/sessionStore';
import { useConsentStore } from '../game/consentStore';
import { cueForPath } from '../audio/cues';
import { useCue } from '../audio/useCue';
import { useT } from '../i18n';
import styles from './GameShell.module.css';

export function GameShell() {
  const tr = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const save = useGameStore((state) => state.save);
  const session = useSessionStore((state) => state.session);
  const consentAccepted = useConsentStore((state) => state.accepted);
  const settings = save.settings;
  const scale = useGameScale(settings.scale);
  const { fullscreen, toggle } = useFullscreen();
  const consentGate =
    location.pathname === '/consent' &&
    (!consentAccepted || save.consent.version < CONSENT_VERSION) &&
    session.loggedIn;
  const isGate =
    location.pathname === '/welcome' || location.pathname === '/login' || consentGate;
  const mode = modeForPath(location.pathname);
  const tabs = tabLinks(save);
  const loginCue =
    location.pathname === '/login' || location.pathname === '/consent' ? 'title' : undefined;
  useCue(loginCue ?? (isGate ? undefined : cueForPath(location.pathname)));

  useEffect(() => {
    audio.apply(settings.audio);
    gateAudio.configure(settings.audio);
  }, [settings.audio]);

  useEffect(() => {
    audio.unlock();
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a')) audio.playSfx(AUDIO_MANIFEST.sfx.click);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    const unlock = () => {
      audio.unlock();
      gateAudio.unlock();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    if (isGate) return;
    const timer = window.setTimeout(() => {
      const heading = document.querySelector('main h1') as HTMLElement | null;
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isGate, location.pathname]);

  useEffect(() => {
    if (isGate || mode === 'afterstory') return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches('input, textarea, select, [contenteditable="true"]') ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }
      const index = Number(event.key) - 1;
      if (index >= 0 && index < tabs.length) {
        event.preventDefault();
        navigate(tabs[index].to);
        return;
      }
      if (event.key.toLowerCase() === 'v') {
        navigate(tabs[1].to);
      }
      if (event.key.toLowerCase() === 'f') {
        navigate(tabs[2].to);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isGate, mode, navigate, tabs]);

  return (
    <div
      className={styles.viewport}
      data-testid="viewport"
      data-contrast={settings.contrast}
      data-font={settings.font}
      data-motion={settings.motion}
    >
      <div
        className={styles.stage}
        data-mode={isGate ? 'gate' : mode}
        data-scanlines={settings.scanlines ? 'on' : 'off'}
        data-scale={scale}
        data-content={hasContent() ? 'private' : 'sample'}
        data-testid="stage"
      >
        {isGate ? (
          <GateStage />
        ) : (
          <WikiWindow
            mode={mode}
            showAddress={mode !== 'consent' && mode !== 'afterstory'}
            showStatus={mode !== 'battle' && mode !== 'afterstory'}
          >
            <Suspense fallback={<div className={styles.loading}>{tr('shell.loading')}</div>}>
              <Outlet />
            </Suspense>
          </WikiWindow>
        )}
        {!isGate && mode !== 'battle' && mode !== 'consent' && mode !== 'afterstory' ? (
          <QuestGuide compact={location.pathname.includes('/replay/')} />
        ) : null}
        <div className={styles.scanlines} aria-hidden="true" />
      </div>
      <button type="button" className={styles.fsBtn} data-on={fullscreen} onClick={toggle} aria-label={tr('dlc.fullscreen')}>
        {fullscreen ? '⤢' : '⛶'}
      </button>
    </div>
  );
}