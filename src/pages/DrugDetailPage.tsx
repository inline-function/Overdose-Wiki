import { Link, useParams } from 'react-router-dom';
import { getDrug } from '../content/registry';
import { DrugDetail } from '../ui/drug/DrugDetail';
import p from './pages.module.css';

export function DrugDetailPage() {
  const { id } = useParams();
  const drug = getDrug(decodeURIComponent(id ?? ''));
  if (!drug) {
    return (
      <article className={p.page}>
        <p className={p.kicker}>分类 / 药品</p>
        <h1 className={p.pageTitle}>未找到药品</h1>
        <p className={p.p}>这条药品档案尚未收录。</p>
        <Link className={p.pixelButton} to="/drugs">
          返回药品索引
        </Link>
      </article>
    );
  }
  return (
    <article className={p.page}>
      <p className={p.kicker}>
        <Link to="/drugs">药品索引</Link> / {drug.name}
      </p>
      <DrugDetail drug={drug} />
      <p>
        <Link className={p.pixelButton} to="/drugs">
          返回药品索引
        </Link>
      </p>
    </article>
  );
}