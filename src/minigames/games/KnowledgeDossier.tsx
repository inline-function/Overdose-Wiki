import { useState } from 'react';
import type { KnowledgeDossierGame } from '../../content/types';
import s from '../minigame.module.css';

const BASE = import.meta.env.BASE_URL;

export function KnowledgeDossier({
  data,
  onReady,
  onCaption,
}: {
  data: KnowledgeDossierGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [flipped, setFlipped] = useState<string[]>([]);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [note, setNote] = useState('四份知识，都还没翻开。');
  const [compiled, setCompiled] = useState(false);
  const allFlipped = flipped.length >= data.cards.length;
  const allChosen = data.cards.every((card) => Boolean(choices[card.id]));

  function flip(cardId: string) {
    if (flipped.includes(cardId)) return;
    const next = [...flipped, cardId];
    setFlipped(next);
    setNote(next.length >= data.cards.length ? '四面都翻开了。现在决定怎么放出去。' : '还有档案没翻开。');
  }

  function choosePolicy(cardId: string, policyId: string) {
    const policy = data.policies.find((item) => item.id === policyId);
    setChoices((current) => ({ ...current, [cardId]: policyId }));
    setNote(policy?.line ?? '记下了。');
    onCaption(policy?.line ?? '记下了一种发布方式。');
  }

  function compile() {
    if (!allFlipped || !allChosen) return;
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
        <span className={s.knowledgeKicker}>两面档案 · 不设标准答案</span>
        <span className={s.knowledgeCount}>{flipped.length} / {data.cards.length} 已翻开</span>
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
                onClick={() => flip(card.id)}
                aria-pressed={isFlipped}
              >
                <span className={s.knowledgeCardTitle}>{card.title}</span>
                <span className={s.knowledgeCardHint}>{isFlipped ? '已翻开' : '翻开'}</span>
              </button>
              {isFlipped ? (
                <>
                  <div className={s.knowledgeFaces}>
                    {card.faces.map((face) => (
                      <p key={face.text} className={s.knowledgeFace} data-tone={face.tone}>
                        {face.tone === 'help' ? '救' : '害'} · {face.text}
                      </p>
                    ))}
                  </div>
                  <div className={s.knowledgePolicies} role="group" aria-label={`${card.title}的发布方式`}>
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
          把方针钉上墙
        </button>
      </div>
    </div>
  );
}
