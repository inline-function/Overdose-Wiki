import { useEffect, useMemo, useState } from 'react';
import type { ForumFixGame } from '../../content/types';
import s from '../minigame.module.css';

function renderPost(
  body: string,
  errors: ForumFixGame['errors'],
  corrected: string[],
  onPick: (id: string) => void,
) {
  return body.split(/(\[\[e\d+\]\])/g).map((part, index) => {
    const match = part.match(/^\[\[(e\d+)\]\]$/);
    if (!match) return <span key={index}>{part}</span>;
    const id = match[1];
    const error = errors[id];
    if (!error) return <span key={index}>{part}</span>;
    if (corrected.includes(id)) {
      return (
        <span key={index} className={s.fixedWord} data-testid="forum-fixed">
          {error.correct}
        </span>
      );
    }
    return (
      <button
        key={index}
        type="button"
        className={s.errorWord}
        data-testid="forum-error"
        data-error={id}
        onClick={() => onPick(id)}
      >
        {error.phrase}
      </button>
    );
  });
}

export function ForumFix({
  data,
  onReady,
  onCaption,
}: {
  data: ForumFixGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [corrected, setCorrected] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const total = useMemo(() => Object.keys(data.errors).length, [data.errors]);
  const all = corrected.length >= total;

  useEffect(() => {
    if (!all) return;
    onReady();
    onCaption(data.closing);
  }, [all, data.closing, onReady, onCaption]);

  function pick(id: string) {
    if (corrected.includes(id)) return;
    setActive(id);
    onCaption('这句话哪里不对？点一个更正。');
  }

  function choose(option: string) {
    if (!active) return;
    const error = data.errors[active];
    if (!error) return;
    if (option === error.correct) {
      setCorrected((current) => (current.includes(active) ? current : [...current, active]));
      onCaption(error.right);
      setActive(null);
      return;
    }
    onCaption(error.wrong);
  }

  const error = active ? data.errors[active] : undefined;

  return (
    <div className={s.forum}>
      <div className={s.thread} data-testid="forum-thread">
        <h3 className={s.threadTitle}>{data.threadTitle}</h3>
        {data.posts.map((post) => (
          <article key={post.id} className={s.post} data-testid="forum-post">
            <div className={s.postAuthor}>
              <span>{post.author}</span>
              <span className={s.postRole}>{post.role}</span>
            </div>
            <p className={s.postBody}>
              {renderPost(post.body, data.errors, corrected, pick)}
            </p>
          </article>
        ))}
      </div>
      <div className={s.correction} data-testid="forum-correction">
        {error ? (
          <>
            <p className={s.correctionPrompt}>
              更正：{error.phrase} → 应该是什么？
            </p>
            <div className={s.optionRow}>
              {error.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={s.option}
                  data-testid="forum-option"
                  onClick={() => choose(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className={s.correctionPrompt}>
            {all ? data.closing : '点帖子里的红字，把错的那句改掉。'}
          </p>
        )}
      </div>
    </div>
  );
}
