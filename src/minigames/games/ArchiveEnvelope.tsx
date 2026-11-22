import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from 'react';
import type { ArchiveCard, ArchiveEnvelopeGame } from '../../content/types';
import s from '../minigame.module.css';

const BASE = import.meta.env.BASE_URL;

type Phase = 'cards' | 'closing' | 'moving' | 'label' | 'bleeding' | 'black';

type Falling = {
  card: ArchiveCard;
  left: number;
  top: number;
};

export function ArchiveEnvelope({
  data,
  onCaption,
  onDone,
}: {
  data: ArchiveEnvelopeGame;
  onCaption: (text: string) => void;
  onDone: () => void;
}) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [falling, setFalling] = useState<Falling | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [drawerClosed, setDrawerClosed] = useState(false);
  const [centered, setCentered] = useState(false);
  const [labelVisible, setLabelVisible] = useState(false);
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<Phase>('cards');
  const typedRef = useRef(0);
  const timers = useRef<number[]>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const envelopeRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLButtonElement | null>(null);

  function after(ms: number, fn: () => void) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  useEffect(() => {
    return () => {
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current = [];
    };
  }, []);

  const allPlaced = placed.length >= data.cards.length;

  useEffect(() => {
    if (!allPlaced || phase !== 'cards') return;
    setPhase('closing');
    setDrawerClosed(true);
    onCaption('抽屉自己合上了。');
    after(700, () => {
      setCentered(true);
      setPhase('moving');
      onCaption('档案袋先快后慢，挪到屏幕中间。');
    });
    after(1900, () => {
      setLabelVisible(true);
      setPhase('label');
      onCaption('标签上还缺一个名字。点它，或按空格 / 回车。');
    });
  }, [allPlaced, phase, onCaption]);

  useEffect(() => {
    if (phase !== 'label') return;
    labelRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  function advance() {
    if (phase !== 'label') return;
    const current = typedRef.current;
    if (current >= data.name.length) return;
    const next = current + 1;
    typedRef.current = next;
    setTyped(next);
    onCaption(
      next === data.name.length
        ? '名字写完了。'
        : `写下第 ${next} 个字：${data.name[next - 1]}。`,
    );
    if (next === data.name.length) {
      setPhase('bleeding');
      after(2400, () => setPhase('black'));
      after(3600, () => onDone());
    }
  }

  function dropCard(card: ArchiveCard) {
    if (phase !== 'cards' || falling || placed.includes(card.id)) return;
    const stage = stageRef.current?.getBoundingClientRect();
    const envelope = envelopeRef.current?.getBoundingClientRect();
    if (!stage) return;
    const left = envelope
      ? ((envelope.left + envelope.width / 2 - stage.left) / stage.width) * 100
      : 30;
    const top = envelope
      ? ((envelope.top + envelope.height * 0.22 - stage.top) / stage.height) * 100
      : 45;
    setFalling({ card, left, top });
    onCaption('手松开了。');
    after(620, () => {
      setFalling(null);
      setPlaced((current) => (current.includes(card.id) ? current : [...current, card.id]));
      onCaption('卡片落进了档案袋。');
    });
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setOver(false);
    setDragging(null);
    if (phase !== 'cards' || falling) return;
    const id = event.dataTransfer.getData('text/plain');
    const card = data.cards.find((item) => item.id === id);
    if (!card) return;
    const stage = stageRef.current?.getBoundingClientRect();
    if (!stage) return;
    const left = ((event.clientX - stage.left) / stage.width) * 100;
    const top = ((event.clientY - stage.top) / stage.height) * 100;
    setFalling({ card, left, top });
    onCaption('手松开了。');
    after(620, () => {
      setFalling(null);
      setPlaced((current) => (current.includes(card.id) ? current : [...current, card.id]));
      onCaption('卡片落进了档案袋。');
    });
  }

  const glow = 0.56 + typed * 0.12;
  const saturation = 0.86 + typed * 0.16;
  const drawerCards = data.cards.filter(
    (card) => !placed.includes(card.id) && falling?.card.id !== card.id,
  );

  return (
    <div className={s.archiveStage} ref={stageRef} data-testid="archive-stage">
      <div
        className={s.archiveBg}
        data-testid="archive-background"
        style={{
          backgroundImage: `url("${BASE}${data.background}")`,
          filter: `blur(calc(1.2 * var(--u))) brightness(${glow}) saturate(${saturation})`,
        }}
        aria-hidden="true"
      />
      <div className={s.archiveHaze} aria-hidden="true" />
      <div className={s.archiveNoise} aria-hidden="true" />

      <div
        className={s.archiveEnvelope}
        ref={envelopeRef}
        data-testid="archive-envelope"
        data-centered={centered}
        data-over={over}
        onDragOver={(event) => {
          event.preventDefault();
          if (!over) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={handleDrop}
      >
        <div className={s.archiveFlap} aria-hidden="true" />
        <span className={s.archiveButtonLeft} aria-hidden="true" />
        <span className={s.archiveButtonRight} aria-hidden="true" />
        <span className={s.archiveStringA} aria-hidden="true" />
        <span className={s.archiveStringB} aria-hidden="true" />
        <span className={s.archiveEnvelopeLabel} aria-hidden="true">档案</span>
        {labelVisible ? (
          <button
            type="button"
            ref={labelRef}
            className={s.archiveNameLabel}
            data-testid="archive-label"
            data-visible={labelVisible}
            aria-label={`在档案袋标签上写名字。第 ${Math.min(typed + 1, data.name.length)} 个字。`}
            onClick={advance}
          >
            <span className={s.archiveNameCaption}>姓名</span>
            <span className={s.archiveName} data-testid="archive-name">
              {Array.from(data.name).map((char, index) => (
                <span key={`${char}-${index}`} data-filled={index < typed}>
                  {index < typed ? char : '＿'}
                </span>
              ))}
            </span>
          </button>
        ) : null}
      </div>

      <div className={s.archiveDrawer} data-testid="archive-drawer" data-closed={drawerClosed}>
        <div className={s.archiveDrawerHead}>
          <span>她说过的</span>
          <span className={s.archiveCount}>{placed.length} / {data.cards.length}</span>
        </div>
        <div className={s.archiveCards}>
          {drawerCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={s.archiveCard}
              data-testid="archive-card"
              data-card={card.id}
              data-dragging={dragging === card.id}
              draggable
              title="拖到档案袋上，松开手；也可以点一下"
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', card.id);
                event.dataTransfer.effectAllowed = 'move';
                setDragging(card.id);
              }}
              onDragEnd={() => setDragging(null)}
              onClick={() => {
                if (dragging) return;
                dropCard(card);
              }}
            >
              {card.text}
            </button>
          ))}
          {drawerCards.length === 0 ? <span className={s.archiveEmpty}>都放进去了。</span> : null}
        </div>
      </div>

      {falling ? (
        <div
          key={falling.card.id}
          className={s.archiveFallingCard}
          data-testid="archive-falling-card"
          style={{ left: `${falling.left}%`, top: `${falling.top}%` } as CSSProperties}
          aria-hidden="true"
        >
          {falling.card.text}
        </div>
      ) : null}

      {phase === 'bleeding' || phase === 'black' ? (
        <div className={s.archiveBleed} data-testid="archive-bleed" aria-hidden="true" />
      ) : null}
      {phase === 'black' ? (
        <div className={s.archiveBlackout} data-testid="archive-black" aria-hidden="true" />
      ) : null}
    </div>
  );
}
