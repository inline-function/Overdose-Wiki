import { lazy, useEffect, type ReactNode } from 'react';
import { createHashRouter, Navigate, useLocation } from 'react-router-dom';
import { GameShell } from './GameShell';
import { ConsentPage } from '../pages/ConsentPage';
import { ChaptersPage } from '../pages/ChaptersPage';
import { CONSENT_VERSION } from '../game/types';
import { gateFor } from '../game/gate';
import { useGameStore } from '../game/store';
import { useSessionStore } from '../game/sessionStore';
import { useConsentStore } from '../game/consentStore';

const HomePage = lazy(() =>
  import('../pages/HomePage').then((module) => ({ default: module.HomePage })),
);
const AfterstoryPage = lazy(() =>
  import('../pages/AfterstoryPage').then((module) => ({ default: module.AfterstoryPage })),
);
const ReportPage = lazy(() =>
  import('../pages/ReportPage').then((module) => ({ default: module.ReportPage })),
);
const ReplayPage = lazy(() =>
  import('../pages/ReplayPage').then((module) => ({ default: module.ReplayPage })),
);
const ArchivePage = lazy(() =>
  import('../pages/ArchivePage').then((module) => ({ default: module.ArchivePage })),
);
const EffectsPage = lazy(() =>
  import('../pages/EffectsPage').then((module) => ({ default: module.EffectsPage })),
);
const DeckPage = lazy(() =>
  import('../pages/DeckPage').then((module) => ({ default: module.DeckPage })),
);
const BoxesPage = lazy(() =>
  import('../pages/BoxesPage').then((module) => ({ default: module.BoxesPage })),
);
const DrugsPage = lazy(() =>
  import('../pages/DrugsPage').then((module) => ({ default: module.DrugsPage })),
);
const DrugDetailPage = lazy(() =>
  import('../pages/DrugDetailPage').then((module) => ({ default: module.DrugDetailPage })),
);
const ExtrasPage = lazy(() =>
  import('../pages/ExtrasPage').then((module) => ({ default: module.ExtrasPage })),
);
const ChatStoryPage = lazy(() =>
  import('../pages/ChatStoryPage').then((module) => ({ default: module.ChatStoryPage })),
);
const DocsPage = lazy(() =>
  import('../pages/DocsPage').then((module) => ({ default: module.DocsPage })),
);
const HistoryPage = lazy(() =>
  import('../pages/HistoryPage').then((module) => ({ default: module.HistoryPage })),
);
const DiscussionPage = lazy(() =>
  import('../pages/DiscussionPage').then((module) => ({ default: module.DiscussionPage })),
);
const SettingsPage = lazy(() =>
  import('../pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
);
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);
const AnalysisIndexPage = lazy(() =>
  import('../pages/AnalysisPage').then((module) => ({ default: module.AnalysisIndexPage })),
);
const AnalysisCasePage = lazy(() =>
  import('../pages/AnalysisPage').then((module) => ({ default: module.AnalysisCasePage })),
);
const DlcCampaignPage = lazy(() =>
  import('../pages/DlcCampaignPage').then((module) => ({ default: module.DlcCampaignPage })),
);
const DlcBattlePage = lazy(() =>
  import('../pages/DlcBattlePage').then((module) => ({ default: module.DlcBattlePage })),
);
const DlcShopPage = lazy(() =>
  import('../pages/DlcShopPage').then((module) => ({ default: module.DlcShopPage })),
);
const DlcEndingPage = lazy(() =>
  import('../pages/DlcEndingPage').then((module) => ({ default: module.DlcEndingPage })),
);
const DlcStoryPage = lazy(() =>
  import('../pages/DlcStoryPage').then((module) => ({ default: module.DlcStoryPage })),
);
const DlcCoverPage = lazy(() =>
  import('../pages/DlcCoverPage').then((module) => ({ default: module.DlcCoverPage })),
);

function DlcGuard({ children }: { children: ReactNode }) {
  const save = useGameStore((state) => state.save);
  if (!save.completedScenes.includes('ch01.s14')) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const UTILITY_PATHS = new Set(['/consent', '/settings']);
const GATE_PATHS = new Set(['/welcome', '/login']);

function GateRoute() {
  return null;
}

function Root() {
  const consent = useGameStore((state) => state.save.consent.version);
  const session = useSessionStore((state) => state.session);
  const patch = useSessionStore((state) => state.patch);
  const location = useLocation();
  const path = `${location.pathname}${location.search}`;
  const contentPath = !UTILITY_PATHS.has(location.pathname) && !GATE_PATHS.has(location.pathname);
  const consentOk = useConsentStore((state) => state.accepted) && consent >= CONSENT_VERSION;
  const gate = gateFor(location.pathname, consentOk, session);
  const gateTo = gate?.to;

  useEffect(() => {
    if (contentPath && gateTo) patch({ pendingFrom: path });
  }, [contentPath, gateTo, path, patch]);

  if (gate) {
    return (
      <Navigate
        to={gate.to}
        replace
        state={contentPath ? { from: path } : undefined}
      />
    );
  }
  return <GameShell />;
}

export const router = createHashRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { path: 'welcome', element: <GateRoute /> },
      { path: 'login', element: <GateRoute /> },
      { index: true, element: <HomePage /> },
      { path: 'consent', element: <ConsentPage /> },
      { path: 'report/:id', element: <ReportPage /> },
      { path: 'report/:id/replay/:seg', element: <ReplayPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'discussion/:id', element: <DiscussionPage /> },
      { path: 'archive', element: <ArchivePage /> },
      { path: 'effects', element: <EffectsPage /> },
      { path: 'effects/:id', element: <EffectsPage /> },
      { path: 'deck', element: <DeckPage /> },
      { path: 'boxes', element: <BoxesPage /> },
      { path: 'drugs', element: <DrugsPage /> },
      { path: 'drugs/:id', element: <DrugDetailPage /> },
      { path: 'battle/:id', element: <Navigate to="/" replace /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'extras', element: <ExtrasPage /> },
      { path: 'extras/scene/:sceneId', element: <ChatStoryPage /> },
      { path: 'extras/:id', element: <ChatStoryPage /> },
      { path: 'analysis', element: <AnalysisIndexPage /> },
      { path: 'analysis/:caseId', element: <AnalysisCasePage /> },
      { path: 'docs', element: <DocsPage /> },
      { path: 'chapters', element: <ChaptersPage /> },
      { path: 'dlc/cover', element: <DlcGuard><DlcCoverPage /></DlcGuard> },
      { path: 'dlc', element: <DlcGuard><DlcCampaignPage /></DlcGuard> },
      { path: 'dlc/battle', element: <DlcGuard><DlcBattlePage /></DlcGuard> },
      { path: 'dlc/endless', element: <DlcGuard><DlcBattlePage endless /></DlcGuard> },
      { path: 'dlc/shop', element: <DlcGuard><DlcShopPage /></DlcGuard> },
      { path: 'dlc/ending', element: <DlcGuard><DlcEndingPage /></DlcGuard> },
      { path: 'dlc/story', element: <DlcGuard><DlcStoryPage /></DlcGuard> },
      { path: 'dlc/story/:id', element: <DlcGuard><DlcStoryPage /></DlcGuard> },
      { path: 'afterstory', element: <AfterstoryPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);