import { useEffect, useMemo, useRef, useState } from 'react';
import type { ForumFixGame } from '../../content/types';
import { shuffleOptions } from '../shuffle';
import s from '../minigame.module.css';
import { useT } from '../../i18n';

type Tr = ReturnType<typeof useT>;

function renderPost(
  body: string,
  errors: ForumFixGame['errors'],
  replied: string[],
  activeId: string | null,
  tr: Tr,
) {
  return body.split(/(\[\[e\d+\]\])/g).map((part, index) => {
    const match = part.match(/^\[\[(e\d+)\]\]$/);
    if (!match) return <span key={index}>{part}</span>;
    const id = match[1];
    const error = errors[id];
    if (!error) return <span key={index}>{part}</span>;
    const done = replied.includes(id);
    return (
      <span
        key={index}
        className={done ? s.repliedWord : s.errorWord}
        data-testid={done ? 'forum-replied' : 'forum-error'}
        data-error={id}
        data-active={id === activeId}
        title={done ? tr('forum.replied') : tr('forum.keepOnly')}
      >
        {error.phrase}
      </span>
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
  const tr = useT();
  const [replied, setReplied] = useState<string[]>([]);
  const threadRef = useRef<HTMLDivElement>(null);
  const order = useMemo(() => Object.keys(data.errors), [data.errors]);
  const total = order.length;
  const all = replied.length >= total;
  const activeId = order.find((id) => !replied.includes(id)) ?? null;
  const error = activeId ? data.errors[activeId] : undefined;

  useEffect(() => {
    if (!all) return;
    onReady();
    onCaption(data.closing);
  }, [all, data.closing, onReady, onCaption]);

  useEffect(() => {
    if (replied.length === 0) return;
    const thread = threadRef.current;
    if (!thread) return;
    thread.scrollTop = thread.scrollHeight;
  }, [replied.length]);

  const options = useMemo(
    () =>
      error
        ? shuffleOptions(error.options, (option) => option === error.correct)
        : [],
    [error],
  );

  function roleFor(id: string): string {
    const post = data.posts.find((item) => item.body.includes(`[[${id}]]`));
    return post?.role ?? tr('forum.original');
  }

  function choose(option: string) {
    if (!activeId || !error) return;
    if (option === error.correct) {
      setReplied((current) => (current.includes(activeId) ? current : [...current, activeId]));
      onCaption(error.right);
      return;
    }
    onCaption(error.wrong);
  }

  return (
    <div className={s.forum}>
      <div className={s.thread} data-testid="forum-thread" ref={threadRef}>
        <h3 className={s.threadTitle}>{data.threadTitle}</h3>
        {data.posts.map((post) => (
          <article key={post.id} className={s.post} data-testid="forum-post">
            <div className={s.postAuthor}>
              <span>{post.author}</span>
              <span className={s.postRole}>{post.role}</span>
            </div>
            <p className={s.postBody}>
              {renderPost(post.body, data.errors, replied, activeId, tr)}
            </p>
          </article>
        ))}
        <div className={s.forumReplies} data-testid="forum-replies" role="log" aria-live="polite">
          {replied.map((id) => {
            const item = data.errors[id];
            if (!item) return null;
            return (
              <article
                key={id}
                className={`${s.post} ${s.replyPost}`}
                data-testid="forum-reply"
                data-error={id}
              >
                <div className={s.postAuthor}>
                  <span>{tr('forum.goto')}</span>
                  <span className={s.postRole}>{tr('forum.reply', { role: roleFor(id) })}</span>
                </div>
                <p className={s.postBody}>
                  <span className={s.replyQuote}>「{item.phrase}」</span>
                  {item.right}
                </p>
              </article>
            );
          })}
        </div>
      </div>
      <div className={s.correction} data-testid="forum-correction">
        {error ? (
          <>
            <p className={s.correctionPrompt}>
              {tr('forum.replyPrompt', { role: roleFor(activeId ?? ''), phrase: error.phrase })}
            </p>
            <div className={s.optionRow}>
              {options.map((option) => (
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
            <p className={s.correctionHint}>{tr('forum.hint')}</p>
          </>
        ) : (
          <p className={s.correctionPrompt}>
            {all ? data.closing : tr('forum.waiting')}
          </p>
        )}
      </div>
    </div>
  );
}
