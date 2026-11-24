import type { ChatFrame, Scene } from './types';
import { t } from '../i18n';

/**
 * Turn a loose-page scene into chat-record layout.
 * The original text is not rewritten: first-person narration goes on the "me"
 * side, handler notes go on the other side, and headings and quotes stay as
 * archive cards. Handler markers exist in both languages because the beat
 * overlay localizes speaker names.
 */
const HANDLER_SPEAKERS = new Set(['处理者手记', "Handler's Notes"]);
const HANDLER_HEADINGS = new Set(['处理者笔记', "Handler's Notes"]);

export function sceneToChatFrames(scene: Scene): ChatFrame[] {
  const frames: ChatFrame[] = [];
  let handlerFramed = false;
  for (const beat of scene.beats) {
    if (beat.type === 'heading') {
      frames.push({ kind: 'note', label: t('chat.loosePage'), text: beat.text });
      continue;
    }
    if (beat.type === 'narration') {
      if (HANDLER_HEADINGS.has(beat.text.trim())) {
        handlerFramed = true;
        continue;
      }
      const handler = HANDLER_SPEAKERS.has(beat.speaker ?? '') || handlerFramed;
      frames.push({
        kind: handler ? 'right' : 'left',
        name: handler ? t('chat.handler') : t('chat.me'),
        text: beat.text,
      });
      continue;
    }
    if (beat.type === 'dialogue') {
      frames.push(
        HANDLER_SPEAKERS.has(beat.speaker ?? '')
          ? { kind: 'right', name: t('chat.handler'), text: beat.text }
          : {
              kind: 'left',
              name: t('chat.me'),
              text: t('chat.speakerPrefix', { name: beat.speaker ?? '' }) + beat.text,
            },
      );
      continue;
    }
    if (beat.type === 'quote') {
      frames.push({ kind: 'note', label: t('chat.originalText'), text: beat.text });
    }
  }
  return frames;
}
