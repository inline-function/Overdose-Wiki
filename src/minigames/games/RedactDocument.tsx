import { useState } from 'react';
import type { RedactDocumentGame } from '../../content/types';
import s from '../minigame.module.css';

const BASE = import.meta.env.BASE_URL;

export function RedactDocument({
  data,
  onReady,
  onCaption,
}: {
  data: RedactDocumentGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [redacted, setRedacted] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [note, setNote] = useState('先看一遍。再决定哪一行不能露出去。');
  const [badLines, setBadLines] = useState<string[]>([]);
  const [published, setPublished] = useState(false);

  function toggleLine(line: (typeof data.lines)[number]) {
    const isRedacted = redacted.includes(line.id);
    setReviewed((current) => (current.includes(line.id) ? current : [...current, line.id]));
    setBadLines((current) => current.filter((id) => id !== line.id));
    setRedacted((current) => (
      isRedacted ? current.filter((id) => id !== line.id) : [...current, line.id]
    ));
    setNote(isRedacted ? '这一行又露出来了。' : '涂黑了。预览里只剩一条黑条。');
  }

  function publish() {
    const wrong = data.lines.filter((line) => {
      const isRedacted = redacted.includes(line.id);
      return line.action === 'redact' ? !isRedacted : isRedacted;
    });
    if (wrong.length > 0) {
      setBadLines(wrong.map((line) => line.id));
      setNote('还有不该露的东西露在外面。再检查一次。');
      onCaption('还有不该露的东西露在外面。再检查一次。');
      return;
    }
    setPublished(true);
    setNote('可以公开了。');
    onCaption(data.closing);
    onReady();
  }

  const allReviewed = reviewed.length >= data.lines.length;

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
            <span className={s.redactCount}>{reviewed.length} / {data.lines.length}</span>
          </div>
          <h2 className={s.redactTitle}>{data.documentTitle}</h2>
          <div className={s.redactLines} role="group" aria-label="逐行选择公开或涂黑">
            {data.lines.map((line) => {
              const isRedacted = redacted.includes(line.id);
              const bad = badLines.includes(line.id);
              return (
                <button
                  key={line.id}
                  type="button"
                  className={s.redactLine}
                  data-testid="redact-line"
                  data-line={line.id}
                  data-redacted={isRedacted}
                  data-reviewed={reviewed.includes(line.id)}
                  data-bad={bad}
                  aria-pressed={isRedacted}
                  onClick={() => toggleLine(line)}
                >
                  <span className={s.redactLineMark}>{isRedacted ? '涂黑' : '公开'}</span>
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
          {data.lines.map((line) => (
            <p key={line.id} className={s.redactPreviewLine}>
              {redacted.includes(line.id) ? '█ █ █ █' : line.text}
            </p>
          ))}
        </aside>
      </div>
      <div className={s.redactFooter}>
        <p className={s.redactNote} aria-live="polite">{note}</p>
        <button
          type="button"
          className={s.redactPublish}
          data-testid="redact-publish"
          disabled={!allReviewed || published}
          onClick={publish}
        >
          公开转载版
        </button>
      </div>
    </div>
  );
}
