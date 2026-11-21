import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { nextGuide } from '../game/guide';
import { useGameStore } from '../game/store';
import { useGuideSuppressed } from './guideState';
import g from './QuestGuide.module.css';

export function QuestGuide({ compact = false }: { compact?: boolean }) {
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
        aria-label="展开任务指引"
      >
        <span className={g.collapsedTag}>任务</span>
        <span className={g.collapsedStep}>{guide.step}</span>
      </button>
    );
  }

  return (
    <aside className={g.guide} aria-label="任务指引" data-testid="quest-guide">
      <header className={g.head}>
        <span className={g.kicker}>任务指引</span>
        <button
          type="button"
          className={g.toggle}
          onClick={() => setOpen(false)}
          aria-label="收起任务指引"
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
