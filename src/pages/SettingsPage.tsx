import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../game/store';
import { useSessionStore } from '../game/sessionStore';
import { useConsentStore } from '../game/consentStore';
import type { ScaleSetting, Settings } from '../game/types';
import { useT } from '../i18n';
import p from './pages.module.css';

export function SettingsPage() {
  const tr = useT();
  const save = useGameStore((state) => state.save);
  const loadError = useGameStore((state) => state.loadError);
  const setSettings = useGameStore((state) => state.setSettings);
  const setStatus = useGameStore((state) => state.setStatus);
  const exportSave = useGameStore((state) => state.exportSave);
  const importSave = useGameStore((state) => state.importSave);
  const resetSave = useGameStore((state) => state.resetSave);
  const patchSession = useSessionStore((state) => state.patch);
  const resetSession = useSessionStore((state) => state.reset);
  const resetConsent = useConsentStore((state) => state.reset);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const settings = save.settings;

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importSave(text);
    event.target.value = '';
  }

  return (
    <article className={p.page}>
      <p className={p.kicker}>{tr('settings.kicker')}</p>
      <h1 className={p.pageTitle}>{tr('settings.title')}</h1>
      {loadError && <p className={p.noticeBox}>{loadError}</p>}

      <div className={p.settingsList}>
        <Row label={tr('settings.scale')} hint={tr('settings.scaleHint')}>
          <Segmented
            value={String(settings.scale)}
            options={[
              { value: 'auto', label: tr('settings.scaleAuto') },
              { value: '1', label: '1×' },
              { value: '2', label: '2×' },
              { value: '3', label: '3×' },
              { value: '4', label: '4×' },
            ]}
            onChange={(value) =>
              setSettings({
                scale: value === 'auto' ? 'auto' : (Number(value) as ScaleSetting),
              })
            }
          />
        </Row>

        <Row label={tr('settings.font')} hint={tr('settings.fontHint')}>
          <Segmented
            value={settings.font}
            options={[
              { value: 'normal', label: tr('settings.fontNormal') },
              { value: 'large', label: tr('settings.fontLarge') },
            ]}
            onChange={(value) => setSettings({ font: value as Settings['font'] })}
          />
        </Row>

        <Row label={tr('settings.motion')} hint={tr('settings.motionHint')}>
          <Segmented
            value={settings.motion}
            options={[
              { value: 'auto', label: tr('settings.motionAuto') },
              { value: 'reduce', label: tr('settings.motionReduce') },
            ]}
            onChange={(value) => setSettings({ motion: value as Settings['motion'] })}
          />
        </Row>

        <Row label={tr('settings.contrast')} hint={tr('settings.contrastHint')}>
          <Segmented
            value={settings.contrast}
            options={[
              { value: 'normal', label: tr('settings.contrastNormal') },
              { value: 'high', label: tr('settings.contrastHigh') },
            ]}
            onChange={(value) => setSettings({ contrast: value as Settings['contrast'] })}
          />
        </Row>

        <Row label={tr('settings.scanlines')} hint={tr('settings.scanlinesHint')}>
          <Segmented
            value={settings.scanlines ? 'on' : 'off'}
            options={[
              { value: 'on', label: tr('settings.on') },
              { value: 'off', label: tr('settings.off') },
            ]}
            onChange={(value) => setSettings({ scanlines: value === 'on' })}
          />
        </Row>

        <Row label={tr('settings.spoilers')} hint={tr('settings.spoilersHint')}>
          <Segmented
            value={settings.spoilers ? 'on' : 'off'}
            options={[
              { value: 'off', label: tr('settings.off') },
              { value: 'on', label: tr('settings.on') },
            ]}
            onChange={(value) => setSettings({ spoilers: value === 'on' })}
          />
        </Row>

        <Row label={tr('settings.audio')} hint={tr('settings.audioHint')}>
          <Segmented
            value={settings.audio.mute ? 'mute' : 'on'}
            options={[
              { value: 'on', label: tr('settings.on') },
              { value: 'mute', label: tr('settings.mute') },
            ]}
            onChange={(value) =>
              setSettings({ audio: { ...settings.audio, mute: value === 'mute' } })
            }
          />
        </Row>

        <AudioRow
          label={tr('settings.bgm')}
          value={settings.audio.bgm}
          onChange={(bgm) => setSettings({ audio: { ...settings.audio, bgm } })}
        />
        <AudioRow
          label={tr('settings.sfx')}
          value={settings.audio.sfx}
          onChange={(sfx) => setSettings({ audio: { ...settings.audio, sfx } })}
        />

        <Row label={tr('settings.save')} hint={tr('settings.saveHint')}>
          <div className={p.segmented}>
            <button type="button" className={p.segButton} onClick={exportSave}>
              {tr('settings.export')}
            </button>
            <button
              type="button"
              className={p.segButton}
              onClick={() => fileRef.current?.click()}
            >
              {tr('settings.import')}
            </button>
            <button
              type="button"
              className={`${p.segButton} ${p.danger}`}
              onClick={() => setConfirmClear(true)}
            >
              {tr('settings.clear')}
            </button>
          </div>
        </Row>

        <Row label={tr('settings.login')} hint={tr('settings.loginHint')}>
          <button
            type="button"
            className={p.segButton}
            onClick={() => {
              patchSession({ loggedIn: false, loginAt: undefined });
              resetConsent();
              navigate('/login', { replace: true });
            }}
          >
            {tr('settings.logout')}
          </button>
        </Row>

        <Row label={tr('settings.music')} hint={tr('settings.musicHint')}>
          <span className={p.versionLine}>{tr('settings.musicAttr')}</span>
        </Row>
      </div>

      <input
        ref={fileRef}
        className={p.fileInput}
        type="file"
        accept="application/json,.json"
        onChange={onFile}
      />

      {confirmClear && (
        <div className={p.confirmBar} role="alert">
          <span>{tr('settings.clearConfirm')}</span>
          <span className={p.confirmActions}>
            <button
              type="button"
              className={`${p.pixelButton} ${p.primary}`}
              onClick={() => {
                resetSave();
                resetSession();
                resetConsent();
                setConfirmClear(false);
                navigate('/consent', { replace: true });
              }}
            >
              {tr('settings.clearConfirmYes')}
            </button>
            <button
              type="button"
              className={p.pixelButton}
              onClick={() => setConfirmClear(false)}
            >
              {tr('settings.cancel')}
            </button>
          </span>
        </div>
      )}

      <div className={p.settingsActions}>
        <button
          type="button"
          className={p.pixelButton}
          onClick={() => {
            setStatus(tr('settings.savedStatus'));
            navigate('/');
          }}
        >
          {tr('settings.backHome')}
        </button>
        <button
          type="button"
          className={p.pixelButton}
          onClick={() => navigate('/consent')}
        >
          {tr('settings.readConsent')}
        </button>
      </div>

      <p className={p.versionLine}>{tr('settings.versionLine')}</p>
    </article>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className={p.settingRow}>
      <span className={p.settingLabel}>
        {label}
        <span className={p.settingHint}>{hint}</span>
      </span>
      {children}
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <span className={p.segmented} role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={p.segButton}
          data-on={value === option.value}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </span>
  );
}

function AudioRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const tr = useT();
  return (
    <Row label={label} hint={`${value}%`}>
      <span className={p.segmented}>
        <button
          type="button"
          className={p.segButton}
          onClick={() => onChange(Math.max(0, value - 10))}
          aria-label={tr('settings.decrease', { label })}
        >
          −
        </button>
        <button
          type="button"
          className={p.segButton}
          onClick={() => onChange(Math.min(100, value + 10))}
          aria-label={tr('settings.increase', { label })}
        >
          +
        </button>
      </span>
    </Row>
  );
}
