import { Link, useParams } from 'react-router-dom';
import p from './pages.module.css';

export function DiscussionPage() {
  const { id } = useParams();
  return (
    <article className={p.page}>
      <p className={p.kicker}>讨论 / 只读</p>
      <h1 className={p.pageTitle}>讨论：报告 {id ?? '7'}</h1>
      <div className={p.noticeBox}>
        此页面已保护。ODW 不做玩家评论、不做后端；讨论页只保留 canon 引文与处理者批注。
      </div>
      <p className={p.articleMeta}>暂无讨论。</p>
      <blockquote className={p.quote}>
        “这是整份档案里唯一一次，他在记录里用了‘不想死’三个字。”
        <br />
        <span className={p.small}>—— 处理者按 · 报告 7 / RP-7-12</span>
      </blockquote>
      <p className={p.small}>
        <Link to={`/report/${id ?? '7'}`}>← 回到报告</Link> ·{' '}
        <Link to="/history">最近更改</Link>
      </p>
    </article>
  );
}