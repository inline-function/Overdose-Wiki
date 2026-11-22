import { beforeEach, describe, expect, it } from 'vitest';
import {
  STORAGE_KEY,
  loadSave,
  mergeSettings,
  migrate,
  parseImport,
} from '../game/persistence';
import { defaultSave } from '../game/types';

describe('save schema', () => {
  beforeEach(() => localStorage.clear());

  it('accepts the default v1 save', () => {
    const save = migrate(defaultSave());
    expect(save).not.toBeNull();
    expect(save?.version).toBe(1);
    expect(save?.progress.segmentId).toBe('ch01.s01');
  });

  it('rejects malformed saves without overwriting them', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1 }));
    const loaded = loadSave();
    expect(loaded.save).toBeNull();
    expect(loaded.error).toContain('保留原档');
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('round-trips import and keeps a valid save', () => {
    const save = defaultSave();
    save.consent = { version: 1, acceptedAt: '2026-01-01T00:00:00.000Z' };
    save.completedScenes = ['ch01.s01'];
    const parsed = parseImport(JSON.stringify(save));
    expect(parsed?.consent.version).toBe(1);
    expect(parsed?.completedScenes).toEqual(['ch01.s01']);
  });

  it('adds completedMinigames when migrating an older save', () => {
    const old = defaultSave() as unknown as Record<string, unknown>;
    delete old.completedMinigames;
    const save = migrate(old as never);
    expect(save?.completedMinigames).toEqual([]);
  });

  it('rejects non-JSON import', () => {
    expect(parseImport('not json')).toBeNull();
  });

  it('merges audio settings without dropping the rest', () => {
    const current = defaultSave().settings;
    const merged = mergeSettings(current, {
      audio: { ...current.audio, bgm: 20 },
    });
    expect(merged.audio.bgm).toBe(20);
    expect(merged.audio.sfx).toBe(current.audio.sfx);
    expect(merged.font).toBe(current.font);
  });
});