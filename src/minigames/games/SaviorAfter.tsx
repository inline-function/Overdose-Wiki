import type { WikiSortPostCompletion } from '../../content/types';
import s from '../minigame.module.css';

export function SaviorAfter({ data }: { data: WikiSortPostCompletion }) {
  return (
    <div className={s.saviorAfter} data-testid="savior-after">
      <div className={s.saviorAfterBoard}>
        {data.categories.map((category) => {
          const cards = data.cards.filter((card) => card.category === category.id);
          return (
            <section
              key={category.id}
              className={s.saviorAfterCategory}
              data-testid="savior-category"
              data-category={category.id}
              aria-label={`${category.label} · ${cards.length}`}
            >
              <span className={s.saviorAfterLabel}>
                {category.label} · {cards.length}
              </span>
              <div className={s.saviorAfterCards}>
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className={s.saviorAfterCard}
                    data-testid="savior-card"
                    data-card={card.id}
                  >
                    <span className={s.saviorAfterCardLabel}>{card.label}</span>
                    <span className={s.saviorAfterCardNote}>{card.note}</span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
