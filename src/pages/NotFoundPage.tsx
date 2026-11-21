import { Link } from 'react-router-dom';
import p from './pages.module.css';

export function NotFoundPage() {
  return (
    <section className={p.placeholder}>
      <p className={p.kicker}>维基 / 404</p>
      <p className={p.notFoundCode}>404</p>
      <h1 className={p.pageTitle}>此页面不存在</h1>
      <p className={p.p}>
        地址可能写错了，或这一页还没有被归档。ODW 不会为不存在的页面编造内容。
      </p>
      <Link className={p.pixelButton} to="/">
        返回首页
      </Link>
    </section>
  );
}