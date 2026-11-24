import { Link } from 'react-router-dom';
import { getChapterMeta, getExtraStoryMetas, getReportMeta } from '../content/registry';
import { useGameStore } from '../game/store';
import { isSceneUnlocked, unlockHint } from '../game/unlocks';
import { useT } from '../i18n';
import p from './pages.module.css';

export function ExtrasPage() {
  const tr = useT();
  const setStatus = useGameStore((state) => state.setStatus);
  const save = useGameStore((state) => state.save);
  const contactStories = getExtraStoryMetas();
  const sideScenes = (getChapterMeta('side')?.scenes ?? []).filter(
    (scene) => scene.id !== 'side-83',
  );
  const chatReport = getReportMeta('20');
  const chatRead = save.read['20']?.includes('chat-20') ?? false;

  return (
    <article className={p.page}>
      <p className={p.kicker}>{tr('extras.kicker')}</p>
      <h1 className={p.pageTitle}>{tr('extras.title')}</h1>
      <p className={p.p}>{tr('extras.intro')}</p>

      <div className={p.extrasGrid}>
        {chatReport ? (
          <Link className={p.extraCard} to="/extras/20">
            <span className={p.extraTitle}>
              {chatReport.no} · {chatReport.title}
            </span>
            <span className={p.extraMeta}>
              {tr('extras.metaChat', {
                who: tr('extras.chat20Who'),
                state: chatRead ? tr('extras.stateRead') : tr('extras.stateMinutes'),
              })}
            </span>
          </Link>
        ) : null}

        {contactStories.map((story) => {
          const read = save.read[story.id]?.includes(`extra-${story.id}`) ?? false;
          const isContact = story.kind === 'contact';
          return (
            <Link key={story.id} className={p.extraCard} to={`/extras/${story.id}`}>
              <span className={p.extraTitle}>
                {isContact ? `${story.id} · ${story.title}` : story.title}
              </span>
              <span className={p.extraMeta}>
                {tr(isContact ? 'extras.metaContact' : 'extras.metaExtra', {
                  date: story.date,
                  state: read ? tr('extras.stateRead') : tr('extras.stateMinutes'),
                })}
              </span>
            </Link>
          );
        })}

        {sideScenes.map((scene) => {
          const report = scene.reportId ? getReportMeta(scene.reportId) : undefined;
          if (!report) return null;
          const unlocked = isSceneUnlocked(scene, save);
          const read = save.read[scene.id]?.includes(`chat-${scene.id}`) ?? false;
          return unlocked ? (
            <Link
              key={scene.id}
              className={p.extraCard}
              to={`/extras/scene/${scene.id}`}
            >
              <span className={p.extraTitle}>
                {report.no} · {report.title}
              </span>
              <span className={p.extraMeta}>
                {tr('extras.metaLoose', {
                  state: read ? tr('extras.stateRead') : tr('extras.stateUnread'),
                })}
              </span>
            </Link>
          ) : (
            <button
              key={scene.id}
              type="button"
              className={p.extraCard}
              data-locked="true"
              onClick={() => setStatus(unlockHint(report))}
            >
              <span className={p.extraTitle}>
                {report.no} · {report.title}
              </span>
              <span className={p.extraMeta}>
                {tr('extras.metaLooseLocked', { hint: unlockHint(report) })}
              </span>
            </button>
          );
        })}
      </div>

      <p className={p.versionLine}>{tr('extras.versionLine')}</p>
    </article>
  );
}
