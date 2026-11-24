import type { AfterstoryRun, EndingId } from '../afterstory/types';
import { create } from 'zustand';
import { t } from '../i18n';
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
import { applyLocale } from '../i18n/locale';

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
  completeMinigame: (id: string) => void;
  setWarTable: (table: Save['warTable']) => void;
  setAfterstory: (active?: AfterstoryRun) => void;
  markAfterstoryEnding: (ending: EndingId) => void;
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
export const DEFAULT_STATUS = '[1–5] 标签 · [V] 复演 · [F] 报告';

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
          makeHistory('settings', t('status.consent'), '#/', 'consent'),
          ...save.history,
        ].slice(0, 200),
      }));
      get().setStatus(t('status.consentSaved'));
    },

    setSettings: (patch) => {
      commit((save) => ({
        ...save,
        settings: mergeSettings(save.settings, patch),
      }));
      if (patch.lang) applyLocale(patch.lang);
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

    setWarTable: (table) => {
      commit((save) => ({ ...save, warTable: table }));
    },


    setAfterstory: (active) => {
      commit((save) => ({
        ...save,
        afterstory: {
          seenEndings: save.afterstory?.seenEndings ?? [],
          ...(active ? { active } : {}),
        },
      }));
    },

    markAfterstoryEnding: (ending) => {
      commit((save) => {
        const seen = save.afterstory?.seenEndings ?? [];
        return {
          ...save,
          afterstory: {
            ...(save.afterstory ?? {}),
            seenEndings: seen.includes(ending) ? seen : [...seen, ending],
          },
        };
      });
    },
    completeMinigame: (id) => {
      commit((save) =>
        save.completedMinigames.includes(id)
          ? save
          : { ...save, completedMinigames: [...save.completedMinigames, id] },
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
      // Language is a reading preference, not progress: clearing the save keeps it.
      const { lang } = get().save.settings;
      const next = defaultSave();
      next.settings = { ...next.settings, lang };
      applyLocale(lang);
      set({ save: next, status: t('status.cleared') });
      scheduleSave(next);
    },

    exportSave: () => {
      downloadSave(get().save);
      get().setStatus(t('status.exported'));
    },

    importSave: (text) => {
      const parsed = parseImport(text);
      if (!parsed) {
        get().setStatus(t('status.importFailed'));
        return false;
      }
      // An imported save must not drag the reader back to the save's language.
      const { lang } = get().save.settings;
      parsed.settings = { ...parsed.settings, lang };
      applyLocale(lang);
      set({ save: parsed });
      scheduleSave(parsed);
      get().setStatus(t('status.imported'));
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