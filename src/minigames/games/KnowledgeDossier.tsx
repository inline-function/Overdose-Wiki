import { useState } from 'react';
import type { KnowledgeDossierGame } from '../../content/types';
import type { WarTable } from '../../game/types';
import { applyWarDecision, effectSummary } from '../../game/warTable';
import s from '../minigame.module.css';
import { useT } from '../../i18n';

const BASE = import.meta.env.BASE_URL;

export function KnowledgeDossier({
  data,
  warTable,
  onWarChange,
  onReady,
  onCaption,
}: {
  data: KnowledgeDossierGame;
  warTable: WarTable;
  onWarChange: (table: WarTable) => void;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const tr = useT();
  const [flipped, setFlipped] = useState<string[]>([]);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [note, setNote] = useState(() => {
    const prior = Object.keys(warTable.decisions).length;
    return prior
      ? tr('knowledge.prior', { n: prior })
      : tr('knowledge.fresh');
  });
  const [compiled, setCompiled] = useState(false);
  const allFlipped = flipped.length >= data.cards.length;
  const allChosen = data.cards.every((card) => Boolean(choices[card.id]));

  function flip(cardId: string) {
    if (flipped.includes(cardId)) return;
    const next = [...flipped, cardId];
    setFlipped(next);
    setNote(next.length >= data.cards.length ? tr('knowledge.allFlipped') : tr('knowledge.someLeft'));
  }

  function choosePolicy(cardId: string, policyId: string) {
    const policy = data.policies.find((item) => item.id === policyId);
    if (!policy) return;
    const next = applyWarDecision(
      warTable,
      `${data.id}:${cardId}`,
      policyId,
      policy.effects,
    );
    onWarChange(next);
    setChoices((current) => ({ ...current, [cardId]: policyId }));
    const hints = effectSummary(policy.effects);
    setNote(`${policy.line}${hints.length ? ` · ${hints.join(' / ')}` : ''}`);
    onCaption(policy.line);
  }

  function compile() {
    if (!allFlipped || !allChosen || compiled) return;
    setCompiled(true);
    setNote(data.closing);
    onCaption(data.closing);
    onReady();
  }

  return (
    <div
      className={s.knowledge}
      data-testid="knowledge-stage"
      style={{ backgroundImage: `url("${BASE}${data.background}")` }}
    >
      <div className={s.knowledgeVeil} aria-hidden="true" />
      <div className={s.knowledgeTop}>
        <span className={s.knowledgeKicker}>{tr('knowledge.kicker')}</span>
        <span className={s.knowledgeCount}>{tr('knowledge.reviewed', { a: flipped.length, b: data.cards.length })}</span>
      </div>
      <div className={s.knowledgeGrid}>
        {data.cards.map((card) => {
          const isFlipped = flipped.includes(card.id);
          const chosen = choices[card.id];
          return (
            <section
              key={card.id}
              className={s.knowledgeCard}
              data-testid="knowledge-card"
              data-card={card.id}
              data-flipped={isFlipped}
            >
              <button
                type="button"
                className={s.knowledgeFlip}
                data-testid="knowledge-flip"
                data-card={card.id}
                disabled={compiled}
                onClick={() => flip(card.id)}
                aria-pressed={isFlipped}
              >
                <span className={s.knowledgeCardTitle}>{card.title}</span>
                <span className={s.knowledgeCardHint}>{isFlipped ? tr('knowledge.flipped') : tr('knowledge.flip')}</span>
              </button>
              {!isFlipped ? <span className={s.knowledgeSeal} aria-hidden="true">{tr('knowledge.twoFaces')}</span> : null}
              {isFlipped ? (
                <>
                  <div className={s.knowledgeFaces}>
                    {card.faces.map((face) => (
                      <p key={face.text} className={s.knowledgeFace} data-tone={face.tone}>
                        {face.tone === 'help' ? tr('knowledge.help') : tr('knowledge.harm')} · {face.text}
                      </p>
                    ))}
                  </div>
                  <div className={s.knowledgePolicies} role="group" aria-label={tr('knowledge.policiesAria', { title: card.title })}>
                    {data.policies.map((policy) => (
                      <button
                        key={policy.id}
                        type="button"
                        className={s.knowledgePolicy}
                        data-testid="knowledge-policy"
                        data-card={card.id}
                        data-policy={policy.id}
                        data-chosen={chosen === policy.id}
                        aria-pressed={chosen === policy.id}
                        disabled={compiled}
                        title={policy.line}
                        onClick={() => choosePolicy(card.id, policy.id)}
                      >
                        {policy.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </section>
          );
        })}
      </div>
      <div className={s.knowledgeFooter}>
        <p className={s.knowledgeNote} aria-live="polite">
          {compiled ? data.closing : note}
        </p>
        <button
          type="button"
          className={s.knowledgeCompile}
          data-testid="knowledge-compile"
          disabled={!allFlipped || !allChosen || compiled}
          onClick={compile}
        >
          {tr('knowledge.pin')}
        </button>
      </div>
    </div>
  );
}
