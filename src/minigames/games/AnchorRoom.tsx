import { useEffect, useRef, useState } from 'react';
import type { AnchorRoomGame } from '../../content/types';
import { shuffleArray } from '../shuffle';
import s from '../minigame.module.css';

const BASE = import.meta.env.BASE_URL;

const SHAPES: Record<string, string> = {
  pillow: s.anchorRoomPillow,
  blanket: s.anchorRoomBlanket,
  cup: s.anchorRoomCup,
  window: s.anchorRoomWindow,
};

export function AnchorRoom({
  data,
  onReady,
  onCaption,
}: {
  data: AnchorRoomGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [tags] = useState(() => shuffleArray(data.anchors));
  const [selected, setSelected] = useState<string | null>(null);
  const [anchored, setAnchored] = useState<string[]>([]);
  const [note, setNote] = useState('先点一个名字。');
  const readyRef = useRef(false);
  const all = anchored.length >= data.anchors.length;

  useEffect(() => {
    if (!all || readyRef.current) return;
    readyRef.current = true;
    onReady();
    onCaption(data.closing);
  }, [all, data.closing, onReady, onCaption]);

  function chooseTag(anchor: (typeof data.anchors)[number]) {
    if (anchored.includes(anchor.id)) return;
    setSelected(anchor.id);
    setNote(`「${anchor.label}」在哪里？`);
    onCaption(`先叫出名字：${anchor.label}。`);
  }

  function chooseObject(anchor: (typeof data.anchors)[number]) {
    if (anchored.includes(anchor.id)) return;
    if (!selected) {
      setNote('先在下面点一个名字。');
      onCaption('先在下面点一个名字，再点房间里的东西。');
      return;
    }
    if (selected === anchor.id) {
      setAnchored((current) => [...current, anchor.id]);
      setSelected(null);
      setNote('叫对了。它停住了。');
      onCaption(anchor.line);
      return;
    }
    setNote('不是这个。再看一眼。');
    onCaption('不是这个。再看一眼。');
  }

  return (
    <div
      className={s.anchorRoom}
      data-testid="anchor-room-stage"
      data-anchored={anchored.length}
      style={{ backgroundImage: `url("${BASE}${data.background}")` }}
    >
      <div className={s.anchorRoomVeil} aria-hidden="true" />
      <div className={s.anchorRoomObjects} role="group" aria-label="房间里的东西">
        {data.anchors.map((anchor) => {
          const pinned = anchored.includes(anchor.id);
          return (
            <button
              key={anchor.id}
              type="button"
              className={s.anchorRoomObject}
              data-testid="anchor-object"
              data-anchor={anchor.id}
              data-anchored={pinned}
              aria-pressed={pinned}
              aria-label={`${anchor.label}的轮廓`}
              onClick={() => chooseObject(anchor)}
              style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
            >
              <span
                className={`${s.anchorRoomShape} ${SHAPES[anchor.id] ?? ''}`}
                aria-hidden="true"
              />
              <span className={s.anchorRoomObjectLabel}>{pinned ? anchor.label : '？'}</span>
            </button>
          );
        })}
      </div>
      <div className={s.anchorRoomTags} role="group" aria-label="纸标签">
        {tags.map((anchor) => (
          <button
            key={anchor.id}
            type="button"
            className={s.anchorRoomTag}
            data-testid="anchor-tag"
            data-anchor={anchor.id}
            data-selected={selected === anchor.id}
            data-anchored={anchored.includes(anchor.id)}
            aria-pressed={selected === anchor.id}
            disabled={anchored.includes(anchor.id)}
            onClick={() => chooseTag(anchor)}
          >
            {anchor.label}
          </button>
        ))}
      </div>
      <p className={s.anchorRoomNote} aria-live="polite">
        {all ? '房间还在。她抱住了枕头。' : note}
      </p>
      <span className={s.anchorRoomCount} aria-label={`已锚定 ${anchored.length} 个，共 ${data.anchors.length} 个`}>
        {anchored.length} / {data.anchors.length}
      </span>
    </div>
  );
}
