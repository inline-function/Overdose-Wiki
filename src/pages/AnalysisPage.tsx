import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnalysisStage } from '../analysis/AnalysisStage';
import { analysisMetas, getAnalysisCase } from '../content/analysis';
import { useGameStore } from '../game/store';
import { useT } from '../i18n';
import p from './pages.module.css';

export function AnalysisIndexPage() {
  const tr = useT();
  const save = useGameStore((state) => state.save);
  const metas = analysisMetas();
  return (
    <article className={p.page}>
      <p className={p.kicker}>{tr('analysisPage.kicker')}</p>
      <h1 className={p.pageTitle}>{tr('analysisPage.title')}</h1>
      <p className={p.p}>{tr('analysisPage.intro')}</p>
      {metas.length === 0 ? (
        <p className={p.p}>{tr('analysisPage.empty')}</p>
      ) : (
        <div className={p.extrasGrid}>
          {metas.map((meta) => {
            const done = save.analysis.includes(meta.id);
            return (
              <Link key={meta.id} className={p.extraCard} to={`/analysis/${meta.id}`}>
                <span className={p.extraTitle}>{meta.title}</span>
                <span className={p.extraMeta}>
                  {meta.subtitle}
                  {done ? tr('analysisPage.doneSuffix') : ''}
                </span>
              </Link>
            );
          })}
        </div>
      )}
      <p className={p.versionLine}>{tr('analysisPage.note')}</p>
    </article>
  );
}

export function AnalysisCasePage() {
  const tr = useT();
  const { caseId } = useParams();
  const navigate = useNavigate();
  const save = useGameStore((state) => state.save);
  const completeAnalysis = useGameStore((state) => state.completeAnalysis);
  const setStatus = useGameStore((state) => state.setStatus);
  const data = caseId ? getAnalysisCase(caseId) : undefined;

  if (!data) {
    return (
      <article className={p.page}>
        <h1 className={p.pageTitle}>{tr('analysisPage.missingTitle')}</h1>
        <p className={p.p}>{tr('analysisPage.missingBody')}</p>
        <Link className={p.p} to="/analysis">
          {tr('analysisPage.backLab')}
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
            {tr('analysisPage.backList')}
          </Link>
        }
        onExit={() => navigate('/analysis')}
        onDone={() => {
          completeAnalysis(data.id);
          setStatus(tr('analysisPage.restored'));
          navigate('/analysis');
        }}
      />
      {done ? <span className="sr-only">{tr('analysisPage.doneSr')}</span> : null}
    </article>
  );
}
