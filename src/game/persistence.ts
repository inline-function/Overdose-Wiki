import {
  CONSENT_VERSION,
  SAVE_VERSION,
  STARTER_CARDS,
  defaultSave,
  defaultWarTable,
  type HistoryEntry,
  type Save,
  type Settings,
} from './types';

export const STORAGE_KEY = 'odw.save.v1';

let timer: number | undefined;
let pending: Save | null = null;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSave(value: unknown): value is Save {
  if (!isObject(value)) return false;
  if (value.version !== SAVE_VERSION) return false;
  if (!isObject(value.consent)) return false;
  if (typeof value.consent.version !== 'number') return false;
  if (!isObject(value.progress)) return false;
  if (typeof value.progress.beat !== 'number') return false;
  if (!isObject(value.read)) return false;
  if (!Array.isArray(value.completedScenes)) return false;
  if (!isObject(value.choices)) return false;
  if (!Array.isArray(value.unlocks)) return false;
  if (!isObject(value.deck)) return false;
  if (!isObject(value.settings)) return false;
  if (!Array.isArray(value.history)) return false;
  return true;
}

export function migrate(raw: unknown): Save | null {
  if (!isObject(raw)) return null;
  if (raw.version === SAVE_VERSION) {
    if (!isSave(raw)) return null;
    const save = raw as Save;
    const owned = save.ownedCards as unknown;
    if (Array.isArray(owned)) {
      save.ownedCards = Object.fromEntries(
        (owned as string[]).map((id) => [id, 1]),
      );
    } else if (owned && typeof owned === 'object') {
      save.ownedCards = Object.fromEntries(
        Object.entries(owned as Record<string, number>)
          .filter(([, count]) => typeof count === 'number' && count > 0)
          .map(([id, count]) => [id, Math.floor(count)]),
      );
    } else {
      save.ownedCards = Object.fromEntries(STARTER_CARDS.map((id) => [id, 1]));
    }
    if (typeof save.boxes !== 'number') save.boxes = 30;
    if (save.boxes === 0 && save.claimedDocs.length === 0 && save.claimedQuests.length === 0) {
      save.boxes = 30;
    }
    save.claimedDocs ??= [];
    save.claimedQuests ??= [];
    save.readEffects ??= [];
    save.seenIntros ??= [];
    save.analysis ??= [];
    save.completedMinigames ??= [];
    if (
      !isObject(save.warTable) ||
      !isObject(save.warTable.decisions) ||
      typeof save.warTable.goto !== 'number' ||
      typeof save.warTable.chicken !== 'number' ||
      typeof save.warTable.trust !== 'number' ||
      typeof save.warTable.archive !== 'number' ||
      typeof save.warTable.escalation !== 'number' ||
      !Array.isArray(save.warTable.flags)
    ) {
      save.warTable = defaultWarTable();
    }
    return save;
  }
  // v1 is the first schema. Future versions add their migrations here.
  return null;
}

export function loadSave(): { save: Save | null; error?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { save: null };
    const parsed: unknown = JSON.parse(raw);
    const save = migrate(parsed);
    if (!save) {
      return {
        save: null,
        error: '存档格式无法识别；已保留原档，可在设置中导出后重置。',
      };
    }
    return { save };
  } catch {
    return {
      save: null,
      error: '存档读取失败；已保留原档，可在设置中导出后重置。',
    };
  }
}

export function scheduleSave(save: Save): void {
  pending = save;
  if (timer !== undefined) window.clearTimeout(timer);
  timer = window.setTimeout(flushSave, 300);
}

export function flushSave(): void {
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timer = undefined;
  }
  if (!pending) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Storage full or disabled: keep the in-memory save and let the UI warn later.
  }
  pending = null;
}

export function clearStoredSave(): void {
  pending = null;
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timer = undefined;
  }
  localStorage.removeItem(STORAGE_KEY);
}

export function parseImport(text: string): Save | null {
  try {
    return migrate(JSON.parse(text) as unknown);
  } catch {
    return null;
  }
}

export function downloadSave(save: Save): void {
  const blob = new Blob([JSON.stringify(save, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `odw-save-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function freshSaveWithConsent(previous?: Save | null): Save {
  const next = previous ? structuredClone(previous) : defaultSave();
  next.consent = {
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
  };
  return next;
}

export function makeHistory(
  kind: HistoryEntry['kind'],
  label: string,
  href: string,
  ref?: string,
): HistoryEntry {
  return {
    at: new Date().toISOString(),
    kind,
    label,
    href,
    ...(ref ? { ref } : {}),
  };
}

export function mergeSettings(current: Settings, patch: Partial<Settings>): Settings {
  return {
    ...current,
    ...patch,
    audio: patch.audio ? { ...current.audio, ...patch.audio } : current.audio,
  };
}