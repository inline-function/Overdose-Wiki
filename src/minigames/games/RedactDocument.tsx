import { useState } from 'react';
import type { RedactDocumentGame, RedactLine } from '../../content/types';
import type { WarTable } from '../../game/types';
import { applyWarDecision, effectSummary, sumWarEffects } from '../../game/warTable';
import { useT } from '../../i18n';
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
  const tr = useT();
  const [redacted, setRedacted] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [note, setNote] = useState(() => {
    const prior = Object.keys(warTable.decisions).length;
    return prior
      ? tr('redact.prior', { n: prior })
      : tr('redact.first');
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
      setNote(tr('redact.budgetOut', { n: data.lines.length - data.budget }));
      return;
    }
    setRedacted((current) => (
      isRedacted ? current.filter((id) => id !== line.id) : [...current, line.id]
    ));
    setNote(isRedacted ? tr('redact.revealed') : tr('redact.blacked'));
  }

  function publish() {
    if (!canPublish) return;
    const protectedPeople = selected.filter((line) => line.stake === 'person').length;
    const publicEvidence = publicLines.filter((line) => line.stake === 'evidence').length;
    const result = protectedPeople > publicEvidence
      ? tr('redact.resultPerson')
      : publicEvidence > protectedPeople
        ? tr('redact.resultEvidence')
        : tr('redact.resultEven');
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
            <span className={s.redactKicker}>{tr('redact.kicker')}</span>
            <span className={s.redactCount}>{tr('redact.reviewed', { a: reviewed.length, b: data.lines.length })}</span>
          </div>
          <h2 className={s.redactTitle}>{data.documentTitle}</h2>
          <div className={s.redactLines} role="group" aria-label={tr('redact.linesAria')}>
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
                    {isRedacted
                      ? tr('redact.markBlack')
                      : line.stake === 'person'
                        ? tr('redact.markPerson')
                        : line.stake === 'evidence'
                          ? tr('redact.markEvidence')
                          : tr('redact.markRecord')}
                  </span>
                  <span className={s.redactLineText}>
                    {isRedacted ? '████████████████' : line.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <aside className={s.redactPreview} aria-label={tr('redact.previewAria')}>
          <p className={s.redactKicker}>{tr('redact.previewKicker')}</p>
          <p className={s.redactBudget}>
            {tr('redact.budget', { a: selected.length, b: data.budget, c: publicLines.length })}
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
        <div className={s.redactEffects} aria-label={tr('redact.effectsAria')}>
          {effectSummary(effects).map((hint) => <span key={hint}>{hint}</span>)}
        </div>
        <button
          type="button"
          className={s.redactPublish}
          data-testid="redact-publish"
          disabled={!canPublish}
          onClick={publish}
        >
          {tr('redact.publish')}
        </button>
      </div>
    </div>
  );
}
