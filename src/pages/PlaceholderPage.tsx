import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import p from './pages.module.css';

type Props = {
  title: string;
  kicker?: string;
  note?: string;
};

export function PlaceholderPage({ title, kicker, note }: Props) {
  const tr = useT();
  return (
    <section className={p.placeholder}>
      <p className={p.kicker}>{kicker ?? tr('placeholder.kicker')}</p>
      <h1 className={p.pageTitle}>{title}</h1>
      <p className={p.p}>{note ?? tr('placeholder.note')}</p>
      <p className={p.small}>
        {tr('placeholder.back')} <Link to="/">{tr('placeholder.home')}</Link> ·{' '}
        {tr('placeholder.orPress')} <span className={p.keycap}>3</span>{' '}
        {tr('placeholder.openReport')}
      </p>
    </section>
  );
}
