import type { ChatFrame, Scene } from './types';

/**
 * 把散页场景转成聊天记录排版。
 * 原文不改写：第一人称叙述放在「我」这一侧，处理者手记放在另一侧，
 * 标题和引文仍用档案卡片分隔。
 */
export function sceneToChatFrames(scene: Scene): ChatFrame[] {
  const frames: ChatFrame[] = [];
  let handlerFramed = false;
  for (const beat of scene.beats) {
    if (beat.type === 'heading') {
      frames.push({ kind: 'note', label: '散页', text: beat.text });
      continue;
    }
    if (beat.type === 'narration') {
      if (beat.text.trim() === '处理者笔记') {
        handlerFramed = true;
        continue;
      }
      const handler = beat.speaker === '处理者手记' || handlerFramed;
      frames.push(
        handler
          ? { kind: 'right', name: '处理者', text: beat.text }
          : { kind: 'left', name: '我', text: beat.text },
      );
      continue;
    }
    if (beat.type === 'dialogue') {
      frames.push(
        beat.speaker === '处理者手记'
          ? { kind: 'right', name: '处理者', text: beat.text }
          : { kind: 'left', name: '我', text: `【${beat.speaker}】${beat.text}` },
      );
      continue;
    }
    if (beat.type === 'quote') {
      frames.push({ kind: 'note', label: '报告原文', text: beat.text });
    }
  }
  return frames;
}
