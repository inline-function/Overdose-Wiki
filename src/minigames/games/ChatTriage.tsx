import { useEffect, useMemo, useState } from 'react';
import type { ChatTriageGame } from '../../content/types';
import { shuffleOptions } from '../shuffle';
import s from '../minigame.module.css';

type Line = { who: 'them' | 'me' | 'sys'; text: string };

export function ChatTriage({
  data,
  onReady,
  onCaption,
}: {
  data: ChatTriageGame;
  onReady: () => void;
  onCaption: (text: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<Line[]>([]);
  const [answered, setAnswered] = useState(false);
  const [wrong, setWrong] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const question = data.questions[index];
  const replies = useMemo(
    () => shuffleOptions(question.replies, (reply) => reply.ok),
    [question],
  );
  const last = index >= data.questions.length - 1;

  useEffect(() => {
    if (!answered || !last) return;
    onReady();
    onCaption(data.closing);
  }, [answered, last, data.closing, onReady, onCaption]);

  function choose(reply: (typeof question.replies)[number]) {
    if (answered) return;
    if (!reply.ok) {
      setWrong((current) => (current.includes(reply.id) ? current : [...current, reply.id]));
      setFeedback(reply.followUp ?? '群里安静了一下。');
      onCaption(reply.reply + (reply.followUp ? ` ${reply.followUp}` : ''));
      return;
    }
    const lines: Line[] = [
      { who: 'them', text: question.text },
      { who: 'me', text: reply.reply },
    ];
    if (reply.followUp) lines.push({ who: 'sys', text: reply.followUp });
    if (question.interlude) lines.push({ who: 'sys', text: question.interlude });
    setHistory((current) => [...current, ...lines]);
    setAnswered(true);
    setFeedback(null);
    setWrong([]);
    onCaption(reply.reply);
  }

  function next() {
    if (!answered) return;
    if (last) {
      onReady();
      onCaption(data.closing);
      return;
    }
    setIndex((current) => current + 1);
    setAnswered(false);
    setFeedback(null);
    setWrong([]);
  }

  return (
    <div className={s.chat}>
      <div className={s.chatLog} data-testid="chat-log">
        {history.map((line, lineIndex) => (
          <div
            key={`${line.who}-${lineIndex}`}
            className={`${s.bubble} ${line.who === 'me' ? s.bubbleMe : ''} ${
              line.who === 'sys' ? s.bubbleSys : ''
            }`}
          >
            {line.who !== 'sys' ? (
              <span className={s.bubbleWho}>{line.who === 'me' ? '后藤' : '群友'}</span>
            ) : null}
            {line.text}
          </div>
        ))}
        {!answered ? (
          <div className={s.bubble} data-testid="chat-question">
            <span className={s.bubbleWho}>{question.from}</span>
            {question.text}
          </div>
        ) : null}
        {feedback ? (
          <div className={s.bubbleSys} data-testid="chat-feedback">
            {feedback}
          </div>
        ) : null}
      </div>
      <div className={s.chatOptions}>
        <span className={s.hint}>
          {index + 1} / {data.questions.length} · 选择回复
        </span>
        {!answered ? (
          replies.map((reply) => (
            <button
              key={reply.id}
              type="button"
              className={s.chatOption}
              data-testid="chat-option"
              data-reply={reply.id}
              disabled={wrong.includes(reply.id)}
              onClick={() => choose(reply)}
            >
              {reply.label}
            </button>
          ))
        ) : (
          <button
            type="button"
            className={`${s.chatOption} ${s.chatNext}`}
            data-testid="chat-next"
            onClick={next}
          >
            {last ? '关掉群聊' : '下一条'}
          </button>
        )}
      </div>
    </div>
  );
}
