import { useState } from 'react';
import type { RedactDocumentGame, RedactLine } from '../../content/types';
import type { WarTable } from '../../game/types';
import { applyWarDecision, effectSummary, sumWarEffects } from '../../game/warTable';
import s from '../minigame.module.css';

const BASE = import.meta.env.BASE_URL;

export function RedactDocument({
  data,
  warTable,
  onWarChange,
  onReady,
  onCaption,
}: {
  data: RedactDocumentGame;
  warTable: WarTable;
  onWarChange: (table: WarTable) => void;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [redacted, setRedacted] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [note, setNote] = useState(() => {
    const prior = Object.keys(warTable.decisions).length;
    return prior
      ? `战局已经记下 ${prior} 次行动。这份文件会替前面的人收尾。`
      : '先看一遍。再决定这份档案要保护谁、留下什么。';
  });
  const [published, setPublished] = useState(false);

  const selected = data.lines.filter((line) => redacted.includes(line.id));
  const publicLines = data.lines.filter((line) => !redacted.includes(line.id));
  const allReviewed = reviewed.length >= data.lines.length;
  const canPublish = allReviewed && publicLines.length >= data.minPublic && !published;
  const effects = sumWarEffects(
    data.lines.map((line) =>
      redacted.includes(line.id) ? line.redactEffects : line.keepEffects,
    ),
  );

  function toggleLine(line: RedactLine) {
    if (published) return;
    const isRedacted = redacted.includes(line.id);
    setReviewed((current) => (current.includes(line.id) ? current : [...current, line.id]));
    if (!isRedacted && redacted.length >= data.budget) {
      setNote(`黑条用完了。剩下 ${data.lines.length - data.budget} 行只能公开。`);
      return;
    }
    setRedacted((current) => (
      isRedacted ? current.filter((id) => id !== line.id) : [...current, line.id]
    ));
    setNote(isRedacted ? '这一行又露出来了。档案多了一句，也多了一个风险。' : '涂黑了。预览里只剩一条黑条。');
  }

  function publish() {
    if (!canPublish) return;
    const protectedPeople = selected.filter((line) => line.stake === 'person').length;
    const publicEvidence = publicLines.filter((line) => line.stake === 'evidence').length;
    const result = protectedPeople > publicEvidence
      ? '你把人保住了，档案变薄。转载的人只能看见残缺的指控。'
      : publicEvidence > protectedPeople
        ? '证据留下了，名字也留下了。下一个人会被这份转载版找到。'
        : '人和证据各留下了一半。谁都能引用这份档案，谁都能说它缺页。';
    const next = applyWarDecision(
      warTable,
      `${data.id}:publish`,
      `redact:${[...redacted].sort().join(',')}`,
      effects,
    );
    onWarChange(next);
    setPublished(true);
    setNote(result);
    onCaption(result);
    onReady();
  }

  return (
    <div
      className={s.redact}
      data-testid="redact-stage"
      style={{ backgroundImage: `url("${BASE}${data.background}")` }}
    >
      <div className={s.redactVeil} aria-hidden="true" />
      <div className={s.redactDesk}>
        <div className={s.redactSheet}>
          <div className={s.redactSheetTop}>
            <span className={s.redactKicker}>公开前 · 转载版</span>
            <span className={s.redactCount}>{reviewed.length} / {data.lines.length} 已审</span>
          </div>
          <h2 className={s.redactTitle}>{data.documentTitle}</h2>
          <div className={s.redactLines} role="group" aria-label="逐行选择公开或涂黑">
            {data.lines.map((line) => {
              const isRedacted = redacted.includes(line.id);
              return (
                <button
                  key={line.id}
                  type="button"
                  className={s.redactLine}
                  data-testid="redact-line"
                  data-line={line.id}
                  data-stake={line.stake}
                  data-redacted={isRedacted}
                  data-reviewed={reviewed.includes(line.id)}
                  aria-pressed={isRedacted}
                  title={line.note}
                  onClick={() => toggleLine(line)}
                >
                  <span className={s.redactLineMark}>
                    {isRedacted ? '黑' : line.stake === 'person' ? '人' : line.stake === 'evidence' ? '证' : '录'}
                  </span>
                  <span className={s.redactLineText}>
                    {isRedacted ? '████████████████' : line.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <aside className={s.redactPreview} aria-label="公开预览">
          <p className={s.redactKicker}>公开版预览</p>
          <p className={s.redactBudget}>
            黑条 {selected.length} / {data.budget} · 公开 {publicLines.length}
          </p>
          {data.lines.map((line) => (
            <p key={line.id} className={s.redactPreviewLine}>
              {redacted.includes(line.id) ? '█ █ █ █' : line.text}
            </p>
          ))}
        </aside>
      </div>
      <div className={s.redactFooter}>
        <p className={s.redactNote} aria-live="polite">{note}</p>
        <div className={s.redactEffects} aria-label="公开后的战局变化">
          {effectSummary(effects).map((hint) => <span key={hint}>{hint}</span>)}
        </div>
        <button
          type="button"
          className={s.redactPublish}
          data-testid="redact-publish"
          disabled={!canPublish}
          onClick={publish}
        >
          公开转载版
        </button>
      </div>
    </div>
  );
}
