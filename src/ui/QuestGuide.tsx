import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { nextGuide } from '../game/guide';
import { useGameStore } from '../game/store';
import { useGuideSuppressed } from './guideState';
import { useT } from '../i18n';
import g from './QuestGuide.module.css';

export function QuestGuide({ compact = false }: { compact?: boolean }) {
  const tr = useT();
  const save = useGameStore((state) => state.save);
  const [open, setOpen] = useState(!compact);
  const guide = nextGuide(save);
  const suppressed = useGuideSuppressed();
  useEffect(() => {
    setOpen(!compact);
  }, [compact]);

  if (suppressed || !guide) return null;

  if (!open) {
    return (
      <button
        type="button"
        className={g.collapsed}
        onClick={() => setOpen(true)}
        title={tr('guide.expandAria')}
      >
        <span className={g.collapsedTag}>{tr('guide.collapsed')}</span>
        <span className={g.collapsedStep}>{guide.step}</span>
      </button>
    );
  }

  return (
    <aside className={g.guide} aria-label={tr('guide.aria')} data-testid="quest-guide">
      <header className={g.head}>
        <span className={g.kicker}>{tr('guide.kicker')}</span>
        <button
          type="button"
          className={g.toggle}
          onClick={() => setOpen(false)}
          aria-label={tr('guide.collapseAria')}
        >
          ×
        </button>
      </header>
      <p className={g.title}>
        {guide.title}
        <span className={g.count}>
          {guide.done}/{guide.total}
        </span>
      </p>
      <p className={g.step}>{guide.step}</p>
      {!guide.finished && (
        <Link className={g.action} to={guide.to}>
          {guide.action} →
        </Link>
      )}
    </aside>
  );
}
