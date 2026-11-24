import { Link, useParams } from 'react-router-dom';
import { useT } from '../i18n';
import p from './pages.module.css';

export function DiscussionPage() {
  const tr = useT();
  const { id } = useParams();
  const reportId = id ?? '7';
  return (
    <article className={p.page}>
      <p className={p.kicker}>{tr('discussion.kicker')}</p>
      <h1 className={p.pageTitle}>{tr('discussion.title', { no: id ?? '7' })}</h1>
      <div className={p.noticeBox}>{tr('discussion.notice')}</div>
      <p className={p.articleMeta}>{tr('discussion.empty')}</p>
      <blockquote className={p.quote}>
        {tr('discussion.quote')}
        <br />
        <span className={p.small}>{tr('discussion.quoteBy')}</span>
      </blockquote>
      <p className={p.small}>
        <Link to={`/report/${reportId}`}>{tr('discussion.backToReport')}</Link> ·{' '}
        <Link to="/history">{tr('discussion.recent')}</Link>
      </p>
    </article>
  );
}
