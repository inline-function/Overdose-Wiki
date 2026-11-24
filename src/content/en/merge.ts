import type { Beat, Chapter, Scene } from '../types';
import { localizeName } from './names';
import type { BeatOverlay, ChapterOverlay, SceneOverlay } from './types';

function withLocalName(beat: Beat): Beat {
  if ('speaker' in beat && beat.speaker) {
    return { ...beat, speaker: localizeName(beat.speaker) ?? beat.speaker };
  }
  return beat;
}

function mergeBeats(beats: Beat[], overlays: BeatOverlay[] | undefined): Beat[] {
  if (!overlays || overlays.length !== beats.length) return beats.map(withLocalName);
  return beats.map((beat, index) => {
    const localized = withLocalName(beat);
    const overlay = overlays[index];
    if (overlay === undefined || overlay === null) return localized;
    if (typeof overlay === 'string') {
      return 'text' in localized ? { ...localized, text: overlay } : localized;
    }
    const next: Beat = { ...localized };
    if (overlay.text !== undefined && 'text' in next) next.text = overlay.text;
    if (overlay.label !== undefined && 'label' in next) next.label = overlay.label;
    if (overlay.prompt !== undefined && 'prompt' in next) next.prompt = overlay.prompt;
    if (
      overlay.options &&
      'options' in next &&
      Array.isArray(next.options) &&
      next.options.length === overlay.options.length
    ) {
      next.options = next.options.map((option, i) => {
        const patch = overlay.options?.[i];
        if (patch === undefined || patch === null) return option;
        const fields = typeof patch === 'string' ? { label: patch } : patch;
        return { ...option, ...fields };
      });
    }
    return next;
  });
}

function mergeScene(scene: Scene, overlay: SceneOverlay | undefined): Scene {
  const merged: Scene = {
    ...scene,
    title: overlay?.title ?? scene.title,
    summary: overlay?.summary ?? scene.summary,
    beats: mergeBeats(scene.beats, overlay?.beats),
  };
  if (merged.stage?.bust) {
    merged.stage = {
      ...merged.stage,
      bust: { ...merged.stage.bust, speaker: localizeName(merged.stage.bust.speaker) ?? '' },
    };
  }
  return merged;
}

export function mergeChapter(chapter: Chapter, overlay: ChapterOverlay | undefined): Chapter {
  if (!overlay) return chapter;
  return {
    ...chapter,
    title: overlay.title ?? chapter.title,
    scenes: chapter.scenes.map((scene) => mergeScene(scene, overlay.scenes[scene.id])),
  };
}
