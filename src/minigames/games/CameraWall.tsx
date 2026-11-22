import { useEffect, useRef, useState } from 'react';
import type { CameraWallGame } from '../../content/types';
import s from '../minigame.module.css';

const BASE = import.meta.env.BASE_URL;

export function CameraWall({
  data,
  onReady,
  onCaption,
}: {
  data: CameraWallGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [scanned, setScanned] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const readyRef = useRef(false);
  const all = scanned.length >= data.feeds.length;
  const activeFeed = data.feeds.find((feed) => feed.id === active);

  useEffect(() => {
    if (!all || readyRef.current) return;
    readyRef.current = true;
    onReady();
    onCaption(data.closing);
  }, [all, data.closing, onReady, onCaption]);

  function scan(feed: (typeof data.feeds)[number]) {
    setActive(feed.id);
    if (!scanned.includes(feed.id)) {
      setScanned((current) => [...current, feed.id]);
    }
    onCaption(feed.line);
  }

  return (
    <div className={s.cameraWall} data-testid="camera-wall-stage" data-scanned={scanned.length}>
      <div className={s.cameraWallGrid} role="group" aria-label="街道监控">
        {data.feeds.map((feed) => {
          const done = scanned.includes(feed.id);
          return (
            <button
              key={feed.id}
              type="button"
              className={s.cameraWallFeed}
              data-testid="camera-feed"
              data-feed={feed.id}
              data-scanned={done}
              data-active={active === feed.id}
              aria-pressed={done}
              onClick={() => scan(feed)}
            >
              <span
                className={s.cameraWallImage}
                style={{ backgroundImage: `url("${BASE}${feed.image}")` }}
                aria-hidden="true"
              />
              <span className={s.cameraWallStatic} aria-hidden="true" />
              <span className={s.cameraWallTime}>{feed.time}</span>
              <span className={s.cameraWallLabel}>{feed.label}</span>
              {done ? <span className={s.cameraWallNoSignal}>无信号</span> : null}
            </button>
          );
        })}
      </div>
      <div className={s.cameraWallReadout} aria-live="polite">
        <span className={s.cameraWallReadoutLabel}>
          {activeFeed ? `${activeFeed.label} · ${activeFeed.time}` : '等待调取监控'}
        </span>
        <span>{activeFeed ? activeFeed.line : '点一格监控。'}</span>
      </div>
      <span className={s.cameraWallCount} aria-label={`已查看 ${scanned.length} 路，共 ${data.feeds.length} 路`}>
        {scanned.length} / {data.feeds.length}
      </span>
    </div>
  );
}
