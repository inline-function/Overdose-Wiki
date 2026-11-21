import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReportBlock } from '../content/types';
import { gateAudio } from '../audio/gateAudio';
import { useSuppressGuide } from '../ui/guideState';
import p from './pages.module.css';

type DocLine =
  | { kind: 'h'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'li'; text: string }
  | { kind: 'image'; src: string; caption?: string };

function toLines(blocks: ReportBlock[] | undefined): DocLine[] {
  const lines: DocLine[] = [];
  for (const block of blocks ?? []) {
    if (block.type === 'h') lines.push({ kind: 'h', text: block.text });
    else if (block.type === 'quote') lines.push({ kind: 'quote', text: block.text });
    else if (block.type === 'list') block.items.forEach((item) => lines.push({ kind: 'li', text: item }));
    else if (block.type === 'image')
      lines.push({ kind: 'image', src: block.src, caption: block.caption });
    else lines.push({ kind: 'p', text: block.text });
  }
  return lines;
}

/** 后藤写文档：每次回车/点击写一段，打字机效果；图片渐显。 */
export function DocWriter({
  title,
  body,
  onDone,
}: {
  title: string;
  body?: ReportBlock[];
  onDone: () => void;
}) {
  useSuppressGuide(true);
  const lines = useMemo(() => toLines(body), [body]);
  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState(false);
  const [chars, setChars] = useState(0);
  const done = index >= lines.length;
  const current = lines[index];
  const finished = useRef(false);
  const paperRef = useRef<HTMLDivElement>(null);

  // 打字时让稿纸始终贴住滚动区底部：新段落、换行和逐字增长都会把视图推下去。
  useLayoutEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    const view = paper.closest<HTMLElement>('[data-doc-scroll], [data-testid="view"]');
    if (!view) return;
    view.scrollTop = view.scrollHeight;
    const frame = window.requestAnimationFrame(() => {
      view.scrollTop = view.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [index, chars, done]);

  useEffect(() => {
    if (!done || finished.current) return;
    finished.current = true;
    const timer = window.setTimeout(onDone, 720);
    return () => window.clearTimeout(timer);
  }, [done, onDone]);

  useEffect(() => {
    if (!typing || !current || current.kind === 'image') return;
    const text = current.text ?? '';
    const stepMs = Math.max(12, Math.min(26, Math.round(1500 / Math.max(10, text.length))));
    const timer = window.setInterval(() => {
      setChars((n) => {
        if (n % 4 === 0) gateAudio.write();
        return n + 1;
      });
    }, stepMs);
    return () => window.clearInterval(timer);
  }, [typing, current]);

  useEffect(() => {
    if (!typing || !current || current.kind === 'image') return;
    if (chars < (current.text ?? '').length) return;
    setTyping(false);
    setChars(0);
    setIndex((value) => value + 1);
  }, [chars, typing, current]);

  const advance = () => {
    if (done) return;
    if (typing && current) {
      if (current.kind !== 'image') setChars(current.text.length);
      setTyping(false);
      setChars(0);
      setIndex((value) => value + 1);
      gateAudio.pop();
      return;
    }
    if (!current) return;
    gateAudio.pop();
    if (current.kind === 'image') {
      setIndex((value) => value + 1);
      return;
    }
    setChars(0);
    setTyping(true);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, a, button, [contenteditable="true"]')) return;
      event.preventDefault();
      advance();
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('a, button, input, textarea, select, [contenteditable="true"]')) return;
      advance();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
    };
  });

  const renderLine = (line: DocLine, key: number, live: boolean) => {
    const text = line.kind === 'image' ? '' : line.text;
    // 未开始写的那一段必须留白：只有正在打字的这一段才逐字显示
    const shown = live ? (typing ? text.slice(0, chars) : '') : text;
    const cursor = live ? <span className={p.writerCursor} aria-hidden="true" /> : null;
    if (line.kind === 'h') {
      return (
        <h2 key={key} className={p.writerH}>
          {shown}
          {cursor}
        </h2>
      );
    }
    if (line.kind === 'quote') {
      return (
        <blockquote key={key} className={p.writerQuote}>
          {shown}
          {cursor}
        </blockquote>
      );
    }
    if (line.kind === 'li') {
      return (
        <p key={key} className={p.writerLi}>
          · {shown}
          {cursor}
        </p>
      );
    }
    if (line.kind === 'image') {
      return (
        <figure key={key} className={p.writerFigure}>
          <img className={p.writerImage} src={line.src} alt={line.caption ?? '文档插图'} />
          {line.caption && <figcaption className={p.writerCaption}>{line.caption}</figcaption>}
        </figure>
      );
    }
    return (
      <p key={key} className={p.writerP}>
        {shown}
        {cursor}
      </p>
    );
  };

  return (
    <section className={p.writer} data-testid="doc-writer" aria-label="编写文档">
      <header className={p.writerBar}>
        <span>编写中 · {title}</span>
        <span className={p.writerCount}>
          {Math.min(index, lines.length)} / {lines.length}
        </span>
      </header>
      <div ref={paperRef} className={p.writerPaper} role="document">
        {lines.slice(0, index).map((line, i) => renderLine(line, i, false))}
        {!done && current ? renderLine(current, index, true) : null}
        {done && (
          <p className={p.writerSigned}>
            —— 后藤 · 写完于 {new Date().toISOString().slice(0, 10)}
          </p>
        )}
      </div>
      <footer className={p.writerHint}>
        {done ? '写完了，正在收进档案…' : 'Enter / 点击屏幕 · 写下一段'}
      </footer>
    </section>
  );
}
