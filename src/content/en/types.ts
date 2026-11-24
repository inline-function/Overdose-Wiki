import type { Chapter } from '../types';

/** One translated beat. A bare string replaces `beat.text`; an object covers the
 *  other visible fields a beat can carry (minigame labels, choice prompts). */
export type OptionOverlay = string | { label?: string; note?: string };

export type BeatOverlay =
  | string
  | null
  | {
      text?: string;
      label?: string;
      prompt?: string;
      options?: OptionOverlay[];
    };

export interface SceneOverlay {
  title?: string;
  summary?: string;
  beats?: BeatOverlay[];
}

export interface ChapterOverlay {
  title?: string;
  scenes: Record<string, SceneOverlay>;
}

export type ChapterForLocale = (chapter: Chapter) => Chapter;
