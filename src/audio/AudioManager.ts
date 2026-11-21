import type { Settings } from '../game/types';
import { CUES, type CueId } from './manifest';

type AudioSettings = Settings['audio'];

class AudioManager {
  private settings: AudioSettings = { bgm: 60, sfx: 70, mute: false };
  private unlocked = false;
  private slots: [HTMLAudioElement | null, HTMLAudioElement | null] = [null, null];
  private active = 0;
  private currentId: CueId | null = null;
  private pending: CueId | null = null;
  private fadeTimer: number | undefined;
  private crossTimer: number | undefined;
  private wasPlaying = false;
  private visibilityBound = false;
  private generation = 0;

  unlock(): void {
    this.unlocked = true;
    this.bindVisibility();
    if (this.pending) {
      const id = this.pending;
      this.pending = null;
      this.start(id);
    }
  }

  apply(settings: AudioSettings): void {
    this.settings = { ...settings };
    const element = this.current();
    if (!element) {
      if (!settings.mute && this.pending && this.unlocked) {
        const id = this.pending;
        this.pending = null;
        this.start(id);
      }
      return;
    }
    if (settings.mute) {
      // 静音要立刻接管：否则交叉淡入的定时器还会往暂停的轨道上写音量
      this.cancelCross(element);
      this.fadeTo(element, 0, 200, () => element.pause());
      return;
    }
    if (element.paused && this.currentId && this.unlocked) {
      const play = element.play();
      if (play && typeof play.catch === 'function') void play.catch(() => undefined);
    }
    this.fadeTo(element, this.targetVolume(), 200);
  }

  playCue(id: string, options: { restart?: boolean; fadeMs?: number } = {}): void {
    const cue = CUES[id as CueId];
    if (!cue) return;
    this.ensureSlots();
    const element = this.current();
    const already = !options.restart && this.currentId === id && element && !element.paused;
    if (already) {
      // 同一首已在播：只把音量拉回来，并确保另一条轨道安静
      this.pauseOthers(element!);
      if (!this.settings.mute) {
        this.fadeTo(element!, this.targetVolume(), options.fadeMs ?? 200);
      }
      return;
    }
    if (this.settings.mute) {
      this.pending = id as CueId;
      return;
    }
    this.start(id as CueId, options.fadeMs ?? 600);
  }

  stopBgm(): void {
    this.generation += 1;
    this.pending = null;
    this.currentId = null;
    this.wasPlaying = false;
    this.clearTimers();
    for (const slot of this.slots) {
      if (!slot) continue;
      slot.pause();
      slot.volume = 0;
    }
  }

  playSfx(src: string | undefined): void {
    if (!src || !this.unlocked || this.settings.mute) return;
    const sound = new Audio(src);
    sound.volume = this.settings.sfx / 100;
    const play = sound.play();
    if (play && typeof play.catch === 'function') void play.catch(() => undefined);
  }

  /** 调试/测试用：当前真正在播的轨道数 */
  playingCount(): number {
    return this.slots.filter((slot) => Boolean(slot && !slot.paused)).length;
  }

  private ensureSlots(): [HTMLAudioElement, HTMLAudioElement] {
    if (!this.slots[0]) {
      this.slots[0] = new Audio();
      this.slots[0].preload = 'auto';
    }
    if (!this.slots[1]) {
      this.slots[1] = new Audio();
      this.slots[1].preload = 'auto';
    }
    return this.slots as [HTMLAudioElement, HTMLAudioElement];
  }

  private current(): HTMLAudioElement | null {
    return this.slots[this.active];
  }

  private targetVolume(): number {
    return this.settings.mute ? 0 : this.settings.bgm / 100;
  }

  private clearTimers(): void {
    if (this.fadeTimer !== undefined) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = undefined;
    }
    if (this.crossTimer !== undefined) {
      window.clearInterval(this.crossTimer);
      this.crossTimer = undefined;
    }
  }

  /** 中止交叉淡入，并掐掉别的轨道 */
  private cancelCross(keep: HTMLAudioElement): void {
    if (this.crossTimer !== undefined) {
      window.clearInterval(this.crossTimer);
      this.crossTimer = undefined;
    }
    this.pauseOthers(keep);
  }

  /** 除了 keep 之外，把所有还在响的轨道立刻掐掉 */
  private pauseOthers(keep: HTMLAudioElement): void {
    for (const slot of this.slots) {
      if (!slot || slot === keep) continue;
      slot.pause();
      slot.volume = 0;
    }
  }

  private start(id: CueId, fadeMs = 600): void {
    const cue = CUES[id];
    const slots = this.ensureSlots();
    const nextIndex = this.active === 0 ? 1 : 0;
    const next = slots[nextIndex];
    const previous = slots[this.active];
    this.generation += 1;
    const generation = this.generation;
    this.clearTimers();
    if (!next.paused) {
      next.pause();
      next.volume = 0;
    }

    next.onended = () => {
      if (!next.loop && this.currentId === id) this.currentId = null;
    };
    next.src = cue.src;
    next.loop = cue.loop;
    next.volume = 0;
    next.currentTime = 0;
    const play = next.play();
    if (play && typeof play.catch === 'function') {
      void play.catch(() => {
        next.pause();
        if (this.currentId === id) {
          this.currentId = null;
          this.pending = id;
        }
      });
    }

    const target = this.targetVolume();
    this.active = nextIndex;
    this.currentId = id;

    if (previous && previous !== next && !previous.paused) {
      this.crossFade(previous, next, target, fadeMs, generation);
    } else {
      if (previous && previous !== next) {
        previous.pause();
        previous.volume = 0;
      }
      this.fadeTo(next, target, Math.min(fadeMs, 600));
    }
  }

  private crossFade(
    previous: HTMLAudioElement,
    next: HTMLAudioElement,
    target: number,
    duration: number,
    generation: number,
  ): void {
    const steps = Math.max(1, Math.round(duration / 33));
    let step = 0;
    const startVolume = previous.volume;
    this.crossTimer = window.setInterval(() => {
      if (generation !== this.generation) {
        if (this.crossTimer !== undefined) window.clearInterval(this.crossTimer);
        this.crossTimer = undefined;
        previous.pause();
        previous.volume = 0;
        return;
      }
      step += 1;
      const progress = step / steps;
      next.volume = target * progress;
      previous.volume = startVolume * (1 - progress);
      if (step >= steps) {
        if (this.crossTimer !== undefined) window.clearInterval(this.crossTimer);
        this.crossTimer = undefined;
        previous.pause();
        previous.volume = 0;
        next.volume = target;
      }
    }, 33);
  }

  private fadeTo(
    element: HTMLAudioElement,
    target: number,
    duration: number,
    done?: () => void,
  ): void {
    if (this.fadeTimer !== undefined) window.clearInterval(this.fadeTimer);
    if (duration <= 0) {
      element.volume = target;
      done?.();
      return;
    }
    const steps = Math.max(1, Math.round(duration / 33));
    const start = element.volume;
    let step = 0;
    this.fadeTimer = window.setInterval(() => {
      step += 1;
      const progress = step / steps;
      element.volume = start + (target - start) * progress;
      if (step >= steps) {
        if (this.fadeTimer !== undefined) window.clearInterval(this.fadeTimer);
        this.fadeTimer = undefined;
        element.volume = target;
        done?.();
      }
    }, 33);
  }

  private bindVisibility(): void {
    if (this.visibilityBound || typeof document === 'undefined') return;
    this.visibilityBound = true;
    document.addEventListener('visibilitychange', () => {
      const element = this.current();
      if (!element) return;
      if (document.hidden) {
        this.wasPlaying = !element.paused;
        element.pause();
      } else if (this.wasPlaying && !this.settings.mute) {
        const play = element.play();
        if (play && typeof play.catch === 'function') void play.catch(() => undefined);
      }
    });
  }
}

export const audio = new AudioManager();
