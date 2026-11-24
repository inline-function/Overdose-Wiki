import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import p from './pages.module.css';

export function NotFoundPage() {
  const tr = useT();
  return (
    <section className={p.placeholder}>
      <p className={p.kicker}>{tr('notFound.kicker')}</p>
      <p className={p.notFoundCode}>404</p>
      <h1 className={p.pageTitle}>{tr('notFound.title')}</h1>
      <p className={p.p}>{tr('notFound.text')}</p>
      <Link className={p.pixelButton} to="/">
        {tr('notFound.back')}
      </Link>
    </section>
  );
}
