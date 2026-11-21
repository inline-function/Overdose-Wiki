import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnalysisStage } from '../analysis/AnalysisStage';
import { analysisMetas, getAnalysisCase } from '../content/analysis';
import { useGameStore } from '../game/store';
import p from './pages.module.css';

export function AnalysisIndexPage() {
  const save = useGameStore((state) => state.save);
  const metas = analysisMetas();
  return (
    <article className={p.page}>
      <p className={p.kicker}>实验台 / 精神分析</p>
      <h1 className={p.pageTitle}>精神分析</h1>
      <p className={p.p}>
        把报告里的蓝词收成积木，串成一条能自洽的链子。后藤的框架不是真理：读的时候保留双读。
      </p>
      {metas.length === 0 ? (
        <p className={p.p}>还没有载入案例（私有大包里的 analysis/ 目录为空）。</p>
      ) : (
        <div className={p.extrasGrid}>
          {metas.map((meta) => {
            const done = save.analysis.includes(meta.id);
            return (
              <Link key={meta.id} className={p.extraCard} to={`/analysis/${meta.id}`}>
                <span className={p.extraTitle}>{meta.title}</span>
                <span className={p.extraMeta}>
                  {meta.subtitle}
                  {done ? ' · 已完成' : ''}
                </span>
              </Link>
            );
          })}
        </div>
      )}
      <p className={p.versionLine}>
        目前只放后藤的自我病例，收在虚数根的「恢复术」写作里；也可以在这里单独重做。
      </p>
    </article>
  );
}

export function AnalysisCasePage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const save = useGameStore((state) => state.save);
  const completeAnalysis = useGameStore((state) => state.completeAnalysis);
  const setStatus = useGameStore((state) => state.setStatus);
  const data = caseId ? getAnalysisCase(caseId) : undefined;

  if (!data) {
    return (
      <article className={p.page}>
        <h1 className={p.pageTitle}>案例缺失</h1>
        <p className={p.p}>没有找到这个精神分析案例。</p>
        <Link className={p.p} to="/analysis">
          返回实验台
        </Link>
      </article>
    );
  }

  const done = save.analysis.includes(data.id);

  return (
    <article className={p.analysisPage}>
      <AnalysisStage
        key={data.id}
        data={data}
        headerRight={
          <Link className={p.analysisBack} to="/analysis">
            返回列表
          </Link>
        }
        onExit={() => navigate('/analysis')}
        onDone={() => {
          completeAnalysis(data.id);
          setStatus('恢复了。恢复术词条收入档案。');
          navigate('/analysis');
        }}
      />
      {done ? <span className="sr-only">这个案例已经完成过。</span> : null}
    </article>
  );
}
