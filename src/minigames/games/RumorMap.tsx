import { useEffect, useRef, useState } from 'react';
import type { RumorMapGame } from '../../content/types';
import s from '../minigame.module.css';

const BASE = import.meta.env.BASE_URL;

export function RumorMap({
  data,
  onReady,
  onCaption,
}: {
  data: RumorMapGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [marked, setMarked] = useState<string[]>([]);
  const [note, setNote] = useState('先看原帖。');
  const readyRef = useRef(false);
  const current = data.steps[step];
  const totalAdded = data.steps.reduce(
    (sum, item) => sum + item.fragments.filter((fragment) => fragment.added).length,
    0,
  );
  const addedHere = current.fragments.filter((fragment) => fragment.added);
  const doneHere = addedHere.every((_, index) => {
    const sourceIndex = current.fragments.findIndex(
      (fragment) => fragment.added && fragment === addedHere[index],
    );
    return marked.includes(`${step}:${sourceIndex}`);
  });
  const all = marked.length >= totalAdded;
  const isLast = step >= data.steps.length - 1;

  useEffect(() => {
    if (!all || readyRef.current) return;
    readyRef.current = true;
    onReady();
    onCaption(data.closing);
  }, [all, data.closing, onReady, onCaption]);

  function markFragment(fragment: (typeof current.fragments)[number], index: number) {
    const key = `${step}:${index}`;
    if (marked.includes(key)) return;
    if (!fragment.added) {
      setNote('这是原帖里就有的句子。');
      onCaption('这是原帖里就有的句子，不是后来加上的。');
      return;
    }
    setMarked((currentMarked) => [...currentMarked, key]);
    setNote(current.line);
    onCaption(current.line);
  }

  function nextStep() {
    if (isLast || !doneHere) return;
    setStep((value) => value + 1);
    setNote('下一张。纸已经皱了。');
    onCaption('下一张传播卡。');
  }

  return (
    <div
      className={s.rumorMap}
      data-testid="rumor-map-stage"
      style={{ backgroundImage: `url("${BASE}${data.background}")` }}
    >
      <div className={s.rumorMapVeil} aria-hidden="true" />
      <div className={s.rumorMapChain} aria-label="传播链">
        {data.steps.map((item, index) => (
          <span
            key={item.id}
            className={s.rumorMapChainStep}
            data-step={item.id}
            data-current={index === step}
            data-done={index < step}
          >
            {index + 1}. {item.label}
          </span>
        ))}
      </div>
      <section className={s.rumorMapCard} data-testid="rumor-step" data-step={current.id}>
        <div className={s.rumorMapCardTop}>
          <span className={s.rumorMapLabel}>{current.label}</span>
          <span className={s.rumorMapCount}>
            {marked.length} / {totalAdded}
          </span>
        </div>
        <div className={s.rumorMapFragments} role="group" aria-label="点出后来加上去的句子">
          {current.fragments.map((fragment, index) => {
            const key = `${step}:${index}`;
            const isMarked = marked.includes(key);
            return (
              <button
                key={`${current.id}-${index}`}
                type="button"
                className={s.rumorMapFragment}
                data-testid="rumor-fragment"
                data-step={current.id}
                data-added={fragment.added}
                data-marked={isMarked}
                aria-pressed={isMarked}
                disabled={isMarked}
                onClick={() => markFragment(fragment, index)}
              >
                {isMarked ? '× ' : fragment.added ? '+ ' : ''}
                {fragment.text}
              </button>
            );
          })}
        </div>
        <p className={s.rumorMapLine} aria-live="polite">
          {all ? data.closing : note}
        </p>
        <div className={s.rumorMapFooter}>
          <span className={s.rumorMapHint}>
            {isLast ? '最后一张。' : doneHere ? '这张看完了。' : '点出后来才加上的部分。'}
          </span>
          {!isLast ? (
            <button
              type="button"
              className={s.rumorMapNext}
              data-testid="rumor-next"
              disabled={!doneHere}
              onClick={nextStep}
            >
              下一张传播卡
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
