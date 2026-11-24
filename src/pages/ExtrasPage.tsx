import { Link } from 'react-router-dom';
import { getChapterMeta, getExtraStoryMetas, getReportMeta } from '../content/registry';
import { useGameStore } from '../game/store';
import { isSceneUnlocked, unlockHint } from '../game/unlocks';
import p from './pages.module.css';

export function ExtrasPage() {
  const setStatus = useGameStore((state) => state.setStatus);
  const save = useGameStore((state) => state.save);
  const contactStories = getExtraStoryMetas();
  const sideScenes = (getChapterMeta('side')?.scenes ?? []).filter(
    (scene) => scene.id !== 'side-83',
  );
  const hasChat = Boolean(getReportMeta('20'));
  const chatRead = save.read['20']?.includes('chat-20') ?? false;

  return (
    <article className={p.page}>
      <p className={p.kicker}>番外 / 记录</p>
      <h1 className={p.pageTitle}>番外</h1>
      <p className={p.p}>
        不进主线的聊天记录、联络人通信与散页；散页统一按聊天记录排版。锁定条目只显示编号与状态。
      </p>

      <div className={p.extrasGrid}>
        {hasChat ? (
          <Link className={p.extraCard} to="/extras/20">
            <span className={p.extraTitle}>20 · 至此证明完毕</span>
            <span className={p.extraMeta}>
              槐树 / 后藤 · 聊天记录 · {chatRead ? '已读' : '约 6 分钟'}
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
                {isContact ? '联络人通信' : '番外'} · {story.date} ·{' '}
                {read ? '已读' : '约 6 分钟'}
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
                散页改排 · 聊天记录 · {read ? '已读' : '未读'}
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
              <span className={p.extraMeta}>散页改排 / {unlockHint(report)}</span>
            </button>
          );
        })}
      </div>

      <p className={p.versionLine}>本页只收录聊天记录；报告与文档仍在档案页。</p>
    </article>
  );
}
