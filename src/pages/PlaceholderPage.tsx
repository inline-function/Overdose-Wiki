import { Link } from 'react-router-dom';
import p from './pages.module.css';

type Props = {
  title: string;
  kicker?: string;
  note?: string;
};

export function PlaceholderPage({ title, kicker = 'S1 内容接入', note }: Props) {
  return (
    <section className={p.placeholder}>
      <p className={p.kicker}>{kicker}</p>
      <h1 className={p.pageTitle}>{title}</h1>
      <p className={p.p}>
        {note ??
          '维基壳已经就位。正文、段落索引、解锁与键盘交互会在 S1 接入；当前页面用于验证窗口、路由与排版。'}
      </p>
      <p className={p.small}>
        返回 <Link to="/">首页</Link> · 或按 <span className={p.keycap}>3</span> 打开报告
      </p>
    </section>
  );
}