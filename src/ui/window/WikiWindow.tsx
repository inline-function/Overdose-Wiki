import { useEffect, useRef, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { fakeUrl } from '../../game/routing';
import { useGameStore } from '../../game/store';
import styles from './WikiWindow.module.css';

type Mode = 'consent' | 'battle' | 'wiki';

const scrollPositions = new Map<string, number>();

type Props = {
  mode: Mode;
  showAddress: boolean;
  showStatus: boolean;
  children: ReactNode;
};

export function WikiWindow({ mode, showAddress, showStatus, children }: Props) {
  const location = useLocation();
  const viewRef = useRef<HTMLDivElement>(null);
  const scrollKey = `${location.pathname}${location.search}`;

  useEffect(() => {
    const element = viewRef.current;
    if (!element) return;
    const saved = scrollPositions.get(scrollKey);
    let attempts = 0;
    let restoring = saved !== undefined;
    const restore = () => {
      const view = viewRef.current;
      if (!view || saved === undefined) return;
      view.scrollTop = saved;
      if (view.scrollTop >= saved || attempts >= 8) {
        restoring = false;
        return;
      }
      attempts += 1;
      window.setTimeout(restore, 80);
    };
    const frame = window.requestAnimationFrame(restore);
    const timer = window.setTimeout(restore, 150);
    const onScroll = () => {
      const current = window.location.hash.replace(/^#/, '') || '/';
      if (!restoring && current === scrollKey) {
        scrollPositions.set(scrollKey, element.scrollTop);
      }
    };
    element.addEventListener('scroll', onScroll, { passive: true });
    const observer = new ResizeObserver(() => {
      if (restoring) restore();
    });
    observer.observe(element);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      element.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [scrollKey]);

  return (
    <div className={styles.window} data-mode={mode}>
      <TitleBar />
      {showAddress && <AddressBar />}
      <div className={styles.content} data-mode={mode}>
        {mode === 'wiki' && (
          <>
            <Sidebar />
            <div className={styles.divider} aria-hidden="true" />
          </>
        )}
        <main className={styles.main}>
          <div
            ref={viewRef}
            data-testid="view"
            className={styles.view}
            data-reading={
              location.pathname.startsWith('/report/') ||
              location.pathname.startsWith('/effects')
            }
          >
            {children}
          </div>
          {showStatus && <StatusLine url={fakeUrl(location.pathname)} />}
        </main>
      </div>
    </div>
  );
}

function TitleBar() {
  const setStatus = useGameStore((state) => state.setStatus);
  return (
    <header className={styles.titlebar}>
      <span>ODW // Overdose Wiki</span>
      <span className={styles.titleButtons} aria-hidden="true">
        {['–', '□', '×'].map((label) => (
          <button
            key={label}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className={styles.titleButton}
            onClick={() => setStatus('窗口由 ODW 持有，无法关闭。')}
          >
            {label}
          </button>
        ))}
      </span>
    </header>
  );
}

function AddressBar() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <nav className={styles.addressBar} aria-label="维基地址栏">
      <button
        type="button"
        className={styles.navButton}
        aria-label="上一页"
        onClick={() => navigate(-1)}
      >
        ←
      </button>
      <button
        type="button"
        className={styles.navButton}
        aria-label="下一页"
        onClick={() => navigate(1)}
      >
        →
      </button>
      <input
        className={styles.addressInput}
        aria-label="网址"
        value={fakeUrl(location.pathname)}
        readOnly
        tabIndex={-1}
        spellCheck={false}
        autoComplete="off"
      />
    </nav>
  );
}

function Sidebar() {
  return (
    <aside className={styles.sidebar} aria-label="维基侧栏">
      <SideLink to="/" label="主页" icon="home" end />
      <span className={styles.sideRule} role="separator" aria-hidden="true" />
      <SideLink to="/chapters" label="剧情" icon="book" />
      <SideLink to="/docs" label="文档" icon="page" />
      <SideLink to="/settings" label="设置" icon="gear" />
    </aside>
  );
}

function StatusLine({ url }: { url: string }) {
  const status = useGameStore((state) => state.status);
  const autoRead = useGameStore((state) => state.autoRead);
  const setAutoRead = useGameStore((state) => state.setAutoRead);
  const setStatus = useGameStore((state) => state.setStatus);
  const inReplay = useLocation().pathname.includes('/replay/');
  return (
    <footer className={styles.statusline}>
      <span className={styles.statusText}>{status}</span>
      <span className={styles.statusActions}>
        {inReplay && (
          <button
            type="button"
            className={styles.statusButton}
            data-on={autoRead}
            aria-pressed={autoRead}
            title="自动阅读：文字显示完后自动翻到下一句"
            onClick={() => {
              const next = !autoRead;
              setAutoRead(next);
              setStatus(next ? '自动阅读：开' : '自动阅读：关');
            }}
          >
            自动
          </button>
        )}
        <span className={styles.statusMeta}>{url}</span>
      </span>
    </footer>
  );
}
function SideLink({
  to,
  label,
  icon,
  end,
}: {
  to: string;
  label: string;
  icon: SideIconName;
  end?: boolean;
}) {
  return (
    <NavLink className={styles.sideLink} to={to} end={end}>
      <span className={styles.sideIcon} aria-hidden="true">
        <SideIcon name={icon} />
      </span>
      <span className={styles.sideLabel}>{label}</span>
    </NavLink>
  );
}

type SideIconName = 'home' | 'book' | 'page' | 'pill' | 'deck' | 'box' | 'star' | 'moon' | 'gear';

function SideIcon({ name }: { name: SideIconName }) {
  const paths: Record<SideIconName, string> = {
    home: 'M4 1 7 4H6v3H2V4H1L4 1Z',
    book: 'M1 2h3v5H1V2Zm3 0h3v5H4V2Z',
    page: 'M2 1h4v6H2V1Zm1 2h2v1H3V3Zm0 2h2v1H3V5Z',
    pill: 'M2 2h2v4H2V2Zm2 0h2v4H4V2Z',
    deck: 'M1 3h3v4H1V3Zm2-2h3v4H3V1Z',
    box: 'M1 3h6v4H1V3Zm1-2h4v2H2V1Z',
    star: 'M4 1l1 2h2L5 4l1 3-2-2-2 2 1-3L1 3h2l1-2Z',
    moon: 'M5 1H3a3 3 0 0 0 0 6h2A3 3 0 0 1 5 1Z',
    gear: 'M3 1h2v1h1v1h1v2H6v1H5v1H3V6H2V5H1V3h1V2h1V1Z',
  };
  return (
    <svg viewBox="0 0 8 8" width="8" height="8" shapeRendering="crispEdges" focusable="false">
      <path d={paths[name]} fill="currentColor" />
    </svg>
  );
}
