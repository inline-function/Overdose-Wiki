import { useEffect, useRef, useState } from 'react';
import type { TestimonyBoardGame } from '../../content/types';
import s from '../minigame.module.css';

const BASE = import.meta.env.BASE_URL;

export function TestimonyBoard({
  data,
  onReady,
  onCaption,
}: {
  data: TestimonyBoardGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [claimIndex, setClaimIndex] = useState(0);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [pairs, setPairs] = useState<string[]>([]);
  const [stamped, setStamped] = useState(false);
  const [note, setNote] = useState('先听第一句。');
  const readyRef = useRef(false);
  const claim = data.claims[claimIndex];
  const pairCount = data.claims.filter((item) => item.contradictionWith).length / 2;

  useEffect(() => {
    if (!stamped || readyRef.current) return;
    readyRef.current = true;
    onReady();
    onCaption(data.closing);
  }, [stamped, data.closing, onReady, onCaption]);

  function chooseVoice(voiceId: string) {
    if (!claim || placed[claim.id]) return;
    const voice = data.voices.find((item) => item.id === voiceId);
    if (voiceId !== claim.voiceId) {
      setNote('这句话不是这个人说的。');
      onCaption('这句话不是这个人说的。再听一遍。');
      return;
    }
    const nextPlaced = { ...placed, [claim.id]: voiceId };
    setPlaced(nextPlaced);
    setNote(`放回「${voice?.name ?? '声音'}」。`);
    onCaption(voice?.line ?? '放回了一个声音。');
    if (claimIndex + 1 >= data.claims.length) {
      setPhase(1);
      setNote('六句话都归位了。现在让它们互相撞。');
    } else {
      setClaimIndex((value) => value + 1);
    }
  }

  function keyFor(a: string, b: string) {
    return [a, b].sort().join('|');
  }

  function chooseCard(id: string) {
    if (!selected) {
      setSelected(id);
      setNote('再点一句，看看它们是不是在互相撕。');
      return;
    }
    if (selected === id) {
      setSelected(null);
      setNote('松开了。');
      return;
    }
    const first = data.claims.find((item) => item.id === selected);
    const second = data.claims.find((item) => item.id === id);
    const contradicts = first && second && (first.contradictionWith === second.id || second.contradictionWith === first.id);
    if (!contradicts) {
      setSelected(id);
      setNote('这两句没有直接打架。换一句。');
      onCaption('这两句没有直接打架。换一句。');
      return;
    }
    const key = keyFor(selected, id);
    if (pairs.includes(key)) {
      setSelected(null);
      return;
    }
    const nextPairs = [...pairs, key];
    setPairs(nextPairs);
    setSelected(null);
    setNote('连上了。没有人退让。');
    onCaption('两句说法对上了。仍然没有人退让。');
    if (nextPairs.length >= pairCount) {
      setPhase(2);
      setNote('三组矛盾都在墙上。盖章吧。');
    }
  }

  return (
    <div
      className={s.testimony}
      data-testid="testimony-stage"
      data-phase={phase}
      style={{ backgroundImage: `url("${BASE}${data.background}")` }}
    >
      <div className={s.testimonyVeil} aria-hidden="true" />
      {phase === 0 ? (
        <section className={s.testimonyListen}>
          <div className={s.testimonyListenTop}>
            <span className={s.testimonyKicker}>声部 {claimIndex + 1} / {data.claims.length}</span>
            <span className={s.testimonyCount}>{Object.keys(placed).length} / {data.claims.length}</span>
          </div>
          <p className={s.testimonyClaimText} data-testid="testimony-claim" data-claim={claim.id}>
            “{claim.text}”
          </p>
          <div className={s.testimonyVoices} role="group" aria-label="这句话是谁说的">
            {data.voices.map((voice) => (
              <button
                key={voice.id}
                type="button"
                className={s.testimonyVoice}
                data-testid="testimony-voice"
                data-voice={voice.id}
                onClick={() => chooseVoice(voice.id)}
              >
                <span className={s.testimonyVoiceName}>{voice.name}</span>
                <span className={s.testimonyVoiceLine}>{voice.line}</span>
              </button>
            ))}
          </div>
          <p className={s.testimonyNote} aria-live="polite">{note}</p>
        </section>
      ) : phase === 1 ? (
        <section className={s.testimonyBoard}>
          <div className={s.testimonyBoardTop}>
            <span className={s.testimonyKicker}>三份说法 · 各自成列</span>
            <span className={s.testimonyCount}>{pairs.length} / {pairCount} 组矛盾</span>
          </div>
          <div className={s.testimonyColumns}>
            {data.voices.map((voice) => (
              <div className={s.testimonyColumn} key={voice.id} data-voice={voice.id}>
                <p className={s.testimonyColumnName}>{voice.name}</p>
                {data.claims
                  .filter((item) => placed[item.id] === voice.id)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={s.testimonyCard}
                      data-testid="testimony-card"
                      data-claim={item.id}
                      data-paired={pairs.includes(keyFor(item.id, item.contradictionWith ?? ''))}
                      data-selected={selected === item.id}
                      aria-pressed={selected === item.id}
                      onClick={() => chooseCard(item.id)}
                    >
                      {item.short}
                    </button>
                  ))}
              </div>
            ))}
          </div>
          <p className={s.testimonyNote} aria-live="polite">{note}</p>
        </section>
      ) : (
        <section className={s.testimonyStampPanel}>
          <p className={s.testimonyKicker}>三组矛盾 · 没有裁决</p>
          <p className={s.testimonyStampCopy}>
            三个声音都还在。{data.closing}
          </p>
          <button
            type="button"
            className={s.testimonyStamp}
            data-testid="testimony-stamp"
            onClick={() => {
              setStamped(true);
              setNote('盖下了。没有盖住任何人的嘴。');
            }}
          >
            盖下「各执一词」章
          </button>
          <p className={s.testimonyNote} aria-live="polite">{note}</p>
        </section>
      )}
    </div>
  );
}
