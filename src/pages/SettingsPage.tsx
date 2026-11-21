import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../game/store';
import { useSessionStore } from '../game/sessionStore';
import { ATTRIBUTION } from '../audio/manifest';
import { useConsentStore } from '../game/consentStore';
import type { ScaleSetting, Settings } from '../game/types';
import p from './pages.module.css';

export function SettingsPage() {
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
      <p className={p.kicker}>设置 / 本地</p>
      <h1 className={p.pageTitle}>设置</h1>
      {loadError && <p className={p.noticeBox}>{loadError}</p>}

      <div className={p.settingsList}>
        <Row label="缩放" hint="自动按窗口取整数倍">
          <Segmented
            value={String(settings.scale)}
            options={[
              { value: 'auto', label: '自动' },
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

        <Row label="字体+" hint="只放大报告/效果正文，不挤战斗">
          <Segmented
            value={settings.font}
            options={[
              { value: 'normal', label: '普通' },
              { value: 'large', label: '放大' },
            ]}
            onChange={(value) => setSettings({ font: value as Settings['font'] })}
          />
        </Row>

        <Row label="减少动效" hint="0ms 硬切；也可跟随系统">
          <Segmented
            value={settings.motion}
            options={[
              { value: 'auto', label: '跟随系统' },
              { value: 'reduce', label: '减少' },
            ]}
            onChange={(value) => setSettings({ motion: value as Settings['motion'] })}
          />
        </Row>

        <Row label="高对比" hint="加深文字与边框，保留纸色">
          <Segmented
            value={settings.contrast}
            options={[
              { value: 'normal', label: '普通' },
              { value: 'high', label: '高' },
            ]}
            onChange={(value) => setSettings({ contrast: value as Settings['contrast'] })}
          />
        </Row>

        <Row label="扫描线" hint="4×4 / 4% 透明">
          <Segmented
            value={settings.scanlines ? 'on' : 'off'}
            options={[
              { value: 'on', label: '开' },
              { value: 'off', label: '关' },
            ]}
            onChange={(value) => setSettings({ scanlines: value === 'on' })}
          />
        </Row>

        <Row label="允许剧透" hint="未读段不再弹确认">
          <Segmented
            value={settings.spoilers ? 'on' : 'off'}
            options={[
              { value: 'off', label: '关' },
              { value: 'on', label: '开' },
            ]}
            onChange={(value) => setSettings({ spoilers: value === 'on' })}
          />
        </Row>

        <Row label="音频" hint="BGM / 音效；首次点击后解锁">
          <Segmented
            value={settings.audio.mute ? 'mute' : 'on'}
            options={[
              { value: 'on', label: '开' },
              { value: 'mute', label: '静音' },
            ]}
            onChange={(value) =>
              setSettings({ audio: { ...settings.audio, mute: value === 'mute' } })
            }
          />
        </Row>

        <AudioRow
          label="BGM"
          value={settings.audio.bgm}
          onChange={(bgm) => setSettings({ audio: { ...settings.audio, bgm } })}
        />
        <AudioRow
          label="音效"
          value={settings.audio.sfx}
          onChange={(sfx) => setSettings({ audio: { ...settings.audio, sfx } })}
        />

        <Row label="存档" hint="只在本机；可导出/导入">
          <div className={p.segmented}>
            <button type="button" className={p.segButton} onClick={exportSave}>
              导出
            </button>
            <button
              type="button"
              className={p.segButton}
              onClick={() => fileRef.current?.click()}
            >
              导入
            </button>
            <button
              type="button"
              className={`${p.segButton} ${p.danger}`}
              onClick={() => setConfirmClear(true)}
            >
              清除
            </button>
          </div>
        </Row>

        <Row label="登录" hint="每个标签页一次">
          <button
            type="button"
            className={p.segButton}
            onClick={() => {
              patchSession({ loggedIn: false, loginAt: undefined });
              resetConsent();
              navigate('/login', { replace: true });
            }}
          >
            退出登录
          </button>
        </Row>

        <Row label="音乐" hint="免费商用音乐包">
          <span className={p.versionLine}>{ATTRIBUTION}</span>
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
          <span>清除本地存档？阅读进度、解锁与卡组都会丢失。</span>
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
              确认清除
            </button>
            <button
              type="button"
              className={p.pixelButton}
              onClick={() => setConfirmClear(false)}
            >
              取消
            </button>
          </span>
        </div>
      )}

      <div className={p.settingsActions}>
        <button
          type="button"
          className={p.pixelButton}
          onClick={() => {
            setStatus('设置已保存在本地。');
            navigate('/');
          }}
        >
          返回首页
        </button>
        <button
          type="button"
          className={p.pixelButton}
          onClick={() => navigate('/consent')}
        >
          重读事先声明
        </button>
      </div>

      <p className={p.versionLine}>
        ODW 0.1.0 · 存档 v1 · 事先声明 v1 · 设置只存本地
      </p>
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
  return (
    <Row label={label} hint={`${value}%`}>
      <span className={p.segmented}>
        <button
          type="button"
          className={p.segButton}
          onClick={() => onChange(Math.max(0, value - 10))}
          aria-label={`${label} 减小`}
        >
          −
        </button>
        <button
          type="button"
          className={p.segButton}
          onClick={() => onChange(Math.min(100, value + 10))}
          aria-label={`${label} 增大`}
        >
          +
        </button>
      </span>
    </Row>
  );
}