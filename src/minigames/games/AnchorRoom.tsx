import { useEffect, useRef, useState } from 'react';
import type { AnchorRoomGame } from '../../content/types';
import { useT } from '../../i18n';
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
  const tr = useT();
  const [note, setNote] = useState(() => tr('anchorRoom.start'));
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
    setNote(tr('anchorRoom.where', { label: anchor.label }));
    onCaption(tr('anchorRoom.whereCaption', { label: anchor.label }));
  }

  function chooseObject(anchor: (typeof data.anchors)[number]) {
    if (anchored.includes(anchor.id)) return;
    if (!selected) {
      setNote(tr('anchorRoom.nameFirst'));
      onCaption(tr('anchorRoom.nameFirstCaption'));
      return;
    }
    if (selected === anchor.id) {
      setAnchored((current) => [...current, anchor.id]);
      setSelected(null);
      setNote(tr('anchorRoom.right'));
      onCaption(anchor.line);
      return;
    }
    setNote(tr('anchorRoom.wrong'));
    onCaption(tr('anchorRoom.wrong'));
  }

  return (
    <div
      className={s.anchorRoom}
      data-testid="anchor-room-stage"
      data-anchored={anchored.length}
      style={{ backgroundImage: `url("${BASE}${data.background}")` }}
    >
      <div className={s.anchorRoomVeil} aria-hidden="true" />
      <div className={s.anchorRoomObjects} role="group" aria-label={tr('anchorRoom.objectsAria')}>
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
              aria-label={tr('anchorRoom.outlineAria', { label: anchor.label })}
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
      <div className={s.anchorRoomTags} role="group" aria-label={tr('anchorRoom.tagsAria')}>
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
        {all ? tr('anchorRoom.all') : note}
      </p>
      <span className={s.anchorRoomCount} aria-label={tr('anchorRoom.countAria', { a: anchored.length, b: data.anchors.length })}>
        {anchored.length} / {data.anchors.length}
      </span>
    </div>
  );
}
