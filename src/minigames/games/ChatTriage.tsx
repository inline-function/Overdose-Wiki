import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatTriageGame } from '../../content/types';
import { shuffleOptions } from '../shuffle';
import s from '../minigame.module.css';
import { useT } from '../../i18n';

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
  const tr = useT();
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<Line[]>([]);
  const [answered, setAnswered] = useState(false);
  const [wrong, setWrong] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<number | null>(null);
  const question = data.questions[index];
  const replies = useMemo(
    () => shuffleOptions(question.replies, (reply) => reply.ok),
    [question],
  );
  const last = index >= data.questions.length - 1;

  useEffect(() => {
    return () => {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    log.scrollTop = log.scrollHeight;
  }, [history.length, answered, index, feedback, typing]);

  function choose(reply: (typeof question.replies)[number]) {
    if (answered) return;
    if (!reply.ok) {
      setWrong((current) => (current.includes(reply.id) ? current : [...current, reply.id]));
      setFeedback(reply.followUp ?? tr('chat.quiet'));
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
    setTyping(true);
    onCaption(reply.reply);
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = null;
      setTyping(false);
      if (last) {
        onReady();
        onCaption(data.closing);
        return;
      }
      setIndex((current) => current + 1);
      setAnswered(false);
      setFeedback(null);
      setWrong([]);
    }, 1500 + Math.random() * 500);
  }

  return (
    <div className={s.chat}>
      <div className={s.chatLog} data-testid="chat-log" ref={logRef}>
        {history.map((line, lineIndex) => (
          <div
            key={`${line.who}-${lineIndex}`}
            className={`${s.bubble} ${line.who === 'me' ? s.bubbleMe : ''} ${
              line.who === 'sys' ? s.bubbleSys : ''
            }`}
            style={{ animationDelay: `${Math.min(lineIndex, 5) * 45}ms` }}
          >
            {line.who !== 'sys' ? (
              <span className={s.bubbleWho}>{line.who === 'me' ? tr('chat.me') : tr('chat.member')}</span>
            ) : null}
            {line.text}
          </div>
        ))}
        {!answered ? (
          <div
            key={question.id}
            className={`${s.bubble} ${s.chatQuestion}`}
            data-testid="chat-question"
          >
            <span className={s.bubbleWho}>{question.from}</span>
            {question.text}
          </div>
        ) : null}
        {typing ? (
          <div className={s.chatTyping} data-testid="chat-typing" aria-label={tr('chat.typingAria')}>
            <span />
            <span />
            <span />
          </div>
        ) : null}
        {feedback ? (
          <div className={s.bubbleSys} data-testid="chat-feedback">
            {feedback}
          </div>
        ) : null}
      </div>
      <div className={s.chatOptions} data-typing={typing}>
        <span className={s.hint}>
          {tr('chat.pickReply', { a: index + 1, b: data.questions.length })}
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
          <span className={s.chatWaiting}>
            {last ? tr('chat.last') : tr('chat.next')}
          </span>
        )}
      </div>
    </div>
  );
}
