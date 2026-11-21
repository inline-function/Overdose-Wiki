import { Link } from 'react-router-dom';
import { getChapterMetas } from '../content/registry';
import { CHAPTER_REPORT } from '../game/routing';
import { useGameStore } from '../game/store';
import { chapterUnlockHint, isChapterUnlocked } from '../game/unlocks';
import { questFor, questTasks } from '../game/quests';
import p from './pages.module.css';

export function ChaptersPage() {
  // DLC 在侧栏单独入口，散页归番外；剧情只列四章主线。
  const chapters = getChapterMetas().filter(
    (chapter) => chapter.id !== 'dlc' && chapter.id !== 'side',
  );
  const save = useGameStore((state) => state.save);
  return (
    <article className={p.page}>
      <p className={p.kicker}>主线 / 章节</p>
      <h1 className={p.pageTitle}>章节</h1>
      <p className={p.p}>从任意章节的第一场开始；已经读过的内容可以随时回到报告。</p>
      <div className={p.archiveGrid}>
        {chapters.map((chapter) => {
          const reportId = CHAPTER_REPORT[chapter.id] ?? '7';
          if (!isChapterUnlocked(chapter, save)) {
            return (
              <button
                key={chapter.id}
                type="button"
                className={p.archiveCard}
                data-locked="true"
                disabled
              >
                <span className={p.archiveTitle}>███ · {chapter.id}</span>
                <span className={p.archiveMeta}>{chapterUnlockHint(chapter.id)}</span>
              </button>
            );
          }
          return (
            <Link
              key={chapter.id}
              className={p.archiveCard}
              to={`/report/${reportId}/replay/${chapter.firstScene}`}
              state={{ replayIntro: true }}
            >
              <span className={p.archiveTitle}>{chapter.title}</span>
              <span className={p.archiveMeta}>
                {chapter.id} · {chapter.sceneCount} 场
              </span>
            </Link>
          );
        })}
      </div>
      {chapters
        .filter((chapter) => questFor(chapter.id))
        .map((chapter) => {
          const quest = questFor(chapter.id)!;
          const tasks = questTasks(save, chapter.id);
          return (
            <section key={chapter.id} className={p.questPanel}>
              <h2 className={p.effectH}>
                任务 · {quest.title}
                <span className={p.small}>
                  {' '}
                  {tasks.filter((task) => task.done).length}/{tasks.length}
                </span>
              </h2>
              <ul className={p.effectList}>
                {tasks.map((task) => (
                  <li key={task.id} data-done={task.done}>
                    {task.done ? '✓' : '□'}{' '}
                    <Link
                      to={
                        task.kind === 'doc'
                          ? `/docs?write=${task.ref}`
                          : `/docs?effect=${encodeURIComponent(task.ref)}`
                      }
                    >
                      {task.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      <p className={p.versionLine}>
        章节解锁需要完成上一章与对应归档任务；支线可提前阅读。
      </p>
    </article>
  );
}
