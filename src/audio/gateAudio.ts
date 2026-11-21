type GateAudioSettings = { mute: boolean; sfx: number };

class GateAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private settings: GateAudioSettings = { mute: false, sfx: 70 };

  get unlocked(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  configure(settings: GateAudioSettings): void {
    this.settings = { ...settings };
    if (this.master) this.master.gain.value = this.level();
  }

  unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.level();
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -14;
        this.compressor.knee.value = 8;
        this.compressor.ratio.value = 8;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.15;
        this.master.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      } catch {
        this.ctx = null;
        this.master = null;
        this.compressor = null;
        return;
      }
    }
    if (this.ctx.state !== 'running') void this.ctx.resume().catch(() => undefined);
  }

  tick(): void {
    this.blip(300, 0.03, 0.18, 'square');
  }

  data(): void {
    this.blip(660, 0.025, 0.16, 'square');
    this.blip(880, 0.025, 0.13, 'square', 1100);
  }

  progress(step: number): void {
    this.blip(220 + step * 45, 0.035, 0.18, 'square');
  }

  key(): void {
    this.blip(1000 + Math.random() * 600, 0.02, 0.2, 'square');
  }

  pop(): void {
    this.blip(520 + Math.random() * 180, 0.05, 0.26, 'triangle');
  }

  drug(): void {
    this.blip(620 + Math.random() * 520, 0.04, 0.22, 'triangle');
    this.blip(900 + Math.random() * 400, 0.03, 0.16, 'square');
  }

  open(): void {
    this.blip(420, 0.05, 0.28, 'square', 760);
  }

  close(): void {
    this.blip(520, 0.05, 0.24, 'square', 240);
  }

  loginOpen(): void {
    this.blip(280, 0.09, 0.25, 'triangle', 620);
    this.noise(0.06, 0.12);
  }

  stamp(): void {
    this.blip(84, 0.18, 0.8, 'sine');
    this.noise(0.12, 0.35);
  }

  glitch(): void {
    this.noise(0.18, 0.45);
    this.blip(180, 0.1, 0.4, 'sawtooth', 60);
  }

  origin(): void {
    this.blip(72, 0.14, 0.24, 'sine');
  }

  axis(): void {
    this.blip(320, 0.05, 0.16, 'square', 560);
  }

  circle(): void {
    this.blip(150, 0.26, 0.14, 'triangle', 720);
  }

  root(index: number): void {
    this.blip(520 + index * 170, 0.08, 0.2, 'square');
  }

  cut(): void {
    this.noise(0.05, 0.52);
    this.blip(1900, 0.035, 0.18, 'square', 820);
    this.blip(210, 0.2, 0.34, 'sawtooth', 52);
    this.blip(72, 0.28, 0.22, 'sine');
  }

  shatter(): void {
    this.noise(0.32, 0.46);
    this.blip(58, 0.34, 0.5, 'sine', 30);
    this.blip(1240, 0.07, 0.16, 'square', 1820);
    this.blip(1720, 0.05, 0.12, 'square', 1400);
    this.blip(2350, 0.05, 0.1, 'triangle', 3100);
  }

  write(): void {
    this.noise(0.05, 0.07);
    this.blip(920, 0.03, 0.1, 'square');
  }

  vanish(): void {
    this.blip(130, 0.22, 0.28, 'sine', 48);
  }

  capsule(): void {
    this.blip(300, 0.05, 0.16, 'triangle', 440);
    this.noise(0.03, 0.08);
  }

  spin(): void {
    this.blip(520, 0.12, 0.09, 'triangle', 980);
  }

  morph(): void {
    this.blip(430, 0.16, 0.14, 'sine', 250);
    this.noise(0.05, 0.1);
  }

  crack(): void {
    this.noise(0.06, 0.3);
    this.blip(1300, 0.04, 0.13, 'square', 720);
  }

  burst(): void {
    this.noise(0.36, 0.5);
    this.blip(74, 0.3, 0.42, 'sine', 36);
    this.blip(280, 0.22, 0.2, 'triangle', 980);
    this.blip(1900, 0.06, 0.12, 'square', 2500);
  }

  shimmer(): void {
    this.blip(2400, 0.5, 0.07, 'sine', 3200);
    this.noise(0.18, 0.1);
  }

  bugs(): void {
    for (let i = 0; i < 7; i += 1) {
      this.blip(2400 + Math.random() * 1100, 0.02, 0.06, 'square');
    }
  }

  fall(): void {
    this.noise(0.5, 0.34);
    this.blip(190, 0.6, 0.3, 'sine', 42);
  }

  drip(): void {
    this.blip(880, 0.16, 0.2, 'sine', 210);
    this.noise(0.03, 0.05);
  }

  /** 震惊：一记闷响 + 短促噪声 */
  impact(): void {
    this.blip(92, 0.22, 0.42, 'sine', 46);
    this.noise(0.14, 0.3);
  }

  /** 解离：下坠的钝响 */
  dissolve(): void {
    this.blip(220, 0.55, 0.22, 'sine', 70);
    this.noise(0.4, 0.1);
  }

  /** 反解离：认知收紧的上行音 */
  focus(): void {
    this.blip(420, 0.16, 0.16, 'square', 1240);
    this.blip(1680, 0.05, 0.1, 'triangle');
  }

  /** 余晖：一声暖铃 */
  halo(): void {
    this.blip(1320, 0.5, 0.1, 'sine', 1760);
    this.blip(880, 0.6, 0.07, 'sine', 1040);
  }

  /** 沮丧：往下塌的长音 */
  hollow(): void {
    this.blip(180, 0.7, 0.18, 'sine', 96);
    this.noise(0.25, 0.06);
  }

  /** 刺目：短促高频 */
  sting(): void {
    this.noise(0.08, 0.34);
    this.blip(2300, 0.06, 0.16, 'square', 1200);
  }

  /** 纸张：档案袋落定 */
  paper(): void {
    this.noise(0.07, 0.22);
    this.blip(96, 0.09, 0.22, 'sine', 58);
  }

  /** 火：短促的干裂声 */
  fire(): void {
    this.noise(0.16, 0.26);
    this.blip(104, 0.12, 0.14, 'sawtooth', 62);
  }

  /** 心跳：两下 */
  heartbeat(): void {
    this.blip(64, 0.16, 0.4, 'sine', 42);
    window.setTimeout(() => this.blip(58, 0.2, 0.32, 'sine', 38), 190);
  }

  /** 撕裂：碎裂噪声 */
  broken(): void {
    this.noise(0.22, 0.3);
    this.blip(340, 0.12, 0.18, 'sawtooth', 120);
  }

  /** 恨意：失真的低音，两下 */
  rage(): void {
    this.blip(124, 0.26, 0.34, 'sawtooth', 62);
    this.noise(0.12, 0.26);
    window.setTimeout(() => {
      this.blip(78, 0.32, 0.3, 'sawtooth', 44);
      this.noise(0.1, 0.18);
    }, 175);
  }

  /** 噪点：沙沙声 */
  hiss(): void {
    this.noise(0.45, 0.16);
  }


  private level(): number {
    if (this.settings.mute) return 0;
    return Math.max(0, Math.min(1, this.settings.sfx / 100)) * 0.9;
  }

  private blip(
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    endFrequency?: number,
  ): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || this.settings.mute) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (endFrequency) osc.frequency.linearRampToValueAtTime(endFrequency, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private noise(duration: number, volume: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || this.settings.mute) return;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frames; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / frames);
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(master);
    source.start();
  }
}

export const gateAudio = new GateAudio();