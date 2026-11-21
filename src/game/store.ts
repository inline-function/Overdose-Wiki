import { create } from 'zustand';
import {
  clearStoredSave,
  downloadSave,
  flushSave,
  loadSave,
  makeHistory,
  mergeSettings,
  parseImport,
  scheduleSave,
} from './persistence';
import {
  CONSENT_VERSION,
  defaultSave,
  type HistoryEntry,
  type Save,
  type Settings,
} from './types';

type GameStore = {
  save: Save;
  loadError?: string;
  status: string;
  autoRead: boolean;
  setAutoRead: (value: boolean) => void;
  setStatus: (message: string) => void;
  acceptConsent: () => void;
  setSettings: (patch: Partial<Settings>) => void;
  setProgress: (patch: Partial<Save['progress']>) => void;
  markRead: (reportId: string, segmentIds: string[]) => void;
  completeScene: (sceneId: string) => void;
  setChoice: (sceneId: string, optionId: string) => void;
  setDeck: (deck: Record<string, number>) => void;
  readEffect: (name: string) => void;
  completeAnalysis: (caseId: string) => void;
  readDoc: (reportId: string, segmentId: string) => void;
  claimQuest: (questId: string) => void;
  claimBox: (cardId: string) => void;
  seeIntro: (chapterId: string) => void;
  addHistory: (entry: HistoryEntry) => void;
  resetSave: () => void;
  exportSave: () => void;
  importSave: (text: string) => boolean;
};

const loaded = loadSave();
const initial = loaded.save ?? defaultSave();
const DEFAULT_STATUS = '[1–5] 标签 · [V] 复演 · [F] 报告';

let statusTimer: number | undefined;

export const useGameStore = create<GameStore>()((set, get) => {
  const commit = (update: (save: Save) => Save) => {
    set((state) => {
      const save = update(state.save);
      scheduleSave(save);
      return { save };
    });
  };

  return {
    save: initial,
    ...(loaded.error ? { loadError: loaded.error } : {}),
    status: loaded.error ?? DEFAULT_STATUS,
    autoRead: false,

    setAutoRead: (value) => set({ autoRead: value }),

    setStatus: (message) => {
      set({ status: message });
      if (statusTimer !== undefined) window.clearTimeout(statusTimer);
      statusTimer = window.setTimeout(() => {
        set({ status: DEFAULT_STATUS });
        statusTimer = undefined;
      }, 4000);
    },

    acceptConsent: () => {
      commit((save) => ({
        ...save,
        consent: {
          version: CONSENT_VERSION,
          acceptedAt: new Date().toISOString(),
        },
        history: [
          makeHistory('settings', '已同意事先声明', '#/', 'consent'),
          ...save.history,
        ].slice(0, 200),
      }));
      get().setStatus('已记录同意；可在设置中重读说明。');
    },

    setSettings: (patch) => {
      commit((save) => ({
        ...save,
        settings: mergeSettings(save.settings, patch),
      }));
    },

    setProgress: (patch) => {
      commit((save) => ({
        ...save,
        progress: { ...save.progress, ...patch },
      }));
    },

    markRead: (reportId, segmentIds) => {
      if (segmentIds.length === 0) return;
      commit((save) => {
        const current = save.read[reportId] ?? [];
        return {
          ...save,
          read: {
            ...save.read,
            [reportId]: Array.from(new Set([...current, ...segmentIds])),
          },
        };
      });
    },

    completeScene: (sceneId) => {
      commit((save) => {
        if (save.completedScenes.includes(sceneId)) return save;
        return {
          ...save,
          completedScenes: [...save.completedScenes, sceneId],
        };
      });
    },

    setChoice: (sceneId, optionId) => {
      commit((save) => ({
        ...save,
        choices: { ...save.choices, [sceneId]: optionId },
      }));
    },

    setDeck: (deck) => {
      commit((save) => ({ ...save, deck }));
    },

    completeAnalysis: (caseId) => {
      commit((save) =>
        save.analysis.includes(caseId)
          ? save
          : { ...save, analysis: [...save.analysis, caseId] },
      );
    },

    readEffect: (name) => {
      commit((save) => {
        if (save.readEffects.includes(name)) return save;
        return { ...save, readEffects: [...save.readEffects, name] };
      });
    },

    readDoc: (reportId, segmentId) => {
      commit((save) => {
        const current = save.read[reportId] ?? [];
        const firstRead = !save.claimedDocs.includes(reportId);
        return {
          ...save,
          read: {
            ...save.read,
            [reportId]: Array.from(new Set([...current, segmentId])),
          },
          ...(firstRead
            ? {
                claimedDocs: [...save.claimedDocs, reportId],
                boxes: save.boxes + 1,
              }
            : {}),
        };
      });
    },

    claimQuest: (questId) => {
      commit((save) => {
        if (save.claimedQuests.includes(questId)) return save;
        return {
          ...save,
          claimedQuests: [...save.claimedQuests, questId],
        };
      });
    },

    claimBox: (cardId) => {
      commit((save) => {
        if (save.boxes <= 0) return save;
        return {
          ...save,
          boxes: save.boxes - 1,
          ownedCards: {
            ...save.ownedCards,
            [cardId]: (save.ownedCards[cardId] ?? 0) + 1,
          },
        };
      });
    },

    seeIntro: (chapterId) => {
      commit((save) => {
        if (save.seenIntros.includes(chapterId)) return save;
        return { ...save, seenIntros: [...save.seenIntros, chapterId] };
      });
    },

    addHistory: (entry) => {
      commit((save) => ({
        ...save,
        history: [entry, ...save.history].slice(0, 200),
      }));
    },

    resetSave: () => {
      flushSave();
      clearStoredSave();
      const next = defaultSave();
      set({ save: next, status: '存档已清除。' });
      scheduleSave(next);
    },

    exportSave: () => {
      downloadSave(get().save);
      get().setStatus('存档已导出。');
    },

    importSave: (text) => {
      const parsed = parseImport(text);
      if (!parsed) {
        get().setStatus('导入失败：文件不是有效的 ODW 存档。');
        return false;
      }
      set({ save: parsed });
      scheduleSave(parsed);
      get().setStatus('存档已导入。');
      return true;
    },
  };
});

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSave();
  });
}