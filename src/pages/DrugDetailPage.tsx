import { Link, useParams } from 'react-router-dom';
import { getDrug } from '../content/registry';
import { useT } from '../i18n';
import { DrugDetail } from '../ui/drug/DrugDetail';
import { drugName } from '../ui/drug/drugText';
import p from './pages.module.css';

export function DrugDetailPage() {
  const tr = useT();
  const { id } = useParams();
  const drug = getDrug(decodeURIComponent(id ?? ''));
  if (!drug) {
    return (
      <article className={p.page}>
        <p className={p.kicker}>{tr('drugs.kicker')}</p>
        <h1 className={p.pageTitle}>{tr('drugs.notFound')}</h1>
        <p className={p.p}>{tr('drugs.notFoundBody')}</p>
        <Link className={p.pixelButton} to="/drugs">
          {tr('drugs.backToList')}
        </Link>
      </article>
    );
  }
  return (
    <article className={p.page}>
      <p className={p.kicker}>
        <Link to="/drugs">{tr('drugs.title')}</Link> / {drugName(drug)}
      </p>
      <DrugDetail drug={drug} />
      <p>
        <Link className={p.pixelButton} to="/drugs">
          {tr('drugs.backToList')}
        </Link>
      </p>
    </article>
  );
}
