// 《稍尽春风》DLC 开场动画。
// 控制台 → 字符参宿四 → 真实恒星 → 爆炸 → 星云 → 分子 / DMT → 下坠 → 碗 → 碎裂 / 泼洒 → 夏日街道。
export const DLC_DURATION = 27.2;

const W = 352;
const H = 198;
const CX = 176;
const CY = 94;

const C = {
  bg: '#07070c',
  paper: '#f3ead8',
  amber: '#e3b54a',
  amberDim: '#8a6b33',
  ember: '#e2502f',
  core: '#fff3d0',
  hot: '#ffc46a',
  mid: '#e8793a',
  edge: '#9c2f22',
  dark: '#5a1712',
  white: '#fffaf0',
  ceramic: '#d9c9a8',
  ceramicShade: '#8a6f52',
  liquid: '#2a1210',
  teal: '#3f8f86',
  rose: '#c2556a',
  violet: '#7a5aa8',
  blue: '#4a6fa8',
  cream: '#f7e6c4',
};

const T = {
  consoleEnd: 3.9,
  asciiStart: 3.35,
  asciiEnd: 5.35,
  realStart: 5.55,
  collapseStart: 7.95,
  collapseEnd: 8.4,
  boom: 8.45,
  nebulaStart: 8.8,
  nebulaFull: 10.5,
  moleculeStart: 13.1,
  moleculeFull: 14.9,
  fallStart: 15.8,
  fallEnd: 19.2,
  bowlStart: 18.5,
  bowlLand: 19.35,
  shatter: 20.62,
  streetStart: 22.65,
  streetFull: 24.15,
  titleStart: 24.35,
};

export type DlcSfx = 'hiss' | 'tick' | 'shimmer' | 'crack' | 'burst' | 'vanish' | 'drip' | 'fall' | 'focus' | 'heartbeat' | 'write';

export const DLC_SFX: Array<{ t: number; key: DlcSfx }> = [
  { t: 0.18, key: 'hiss' },
  { t: 0.7, key: 'tick' },
  { t: 1.2, key: 'tick' },
  { t: 1.7, key: 'tick' },
  { t: 2.2, key: 'tick' },
  { t: 2.7, key: 'tick' },
  { t: 3.2, key: 'tick' },
  { t: 3.5, key: 'shimmer' },
  { t: 5.7, key: 'shimmer' },
  { t: 7.98, key: 'crack' },
  { t: 8.45, key: 'burst' },
  { t: 9.2, key: 'hiss' },
  { t: 10.6, key: 'shimmer' },
  { t: 13.25, key: 'focus' },
  { t: 14.1, key: 'focus' },
  { t: 15.8, key: 'heartbeat' },
  { t: 16.8, key: 'heartbeat' },
  { t: 18.55, key: 'fall' },
  { t: 19.35, key: 'drip' },
  { t: 20.18, key: 'crack' },
  { t: 20.62, key: 'crack' },
  { t: 20.7, key: 'burst' },
  { t: 21.0, key: 'drip' },
  { t: 21.4, key: 'drip' },
  { t: 22.3, key: 'vanish' },
  { t: 22.75, key: 'hiss' },
  { t: 24.45, key: 'shimmer' },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function phase(time: number, start: number, end: number) {
  return clamp((time - start) / (end - start), 0, 1);
}

function easeOut(value: number, power = 2) {
  return 1 - (1 - value) ** power;
}

function easeIn(value: number, power = 2) {
  return value ** power;
}

function hash(a: number, b: number, c: number) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

function scanlines(ctx: CanvasRenderingContext2D, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';
  for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
  ctx.restore();
}

function grain(ctx: CanvasRenderingContext2D, time: number) {
  const frame = Math.floor(time * 12);
  ctx.save();
  for (let i = 0; i < 72; i += 1) {
    const x = Math.floor(hash(i, frame, 1) * W);
    const y = Math.floor(hash(i, frame, 2) * H);
    ctx.globalAlpha = 0.025 + hash(i, frame, 3) * 0.045;
    ctx.fillStyle = hash(i, frame, 4) > 0.5 ? C.paper : C.amber;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

function corner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  len: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + dy * len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + dx * len, y);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// 控制台
// ---------------------------------------------------------------------------

type TerminalLine = {
  text: string;
  start: number;
  cps: number;
  tone: 'dim' | 'amber' | 'ember';
};

const TERMINAL_LINES: TerminalLine[] = [
  { text: '$ link --deep-field', start: 0.2, cps: 34, tone: 'dim' },
  { text: '  uplink established', start: 0.6, cps: 44, tone: 'dim' },
  { text: '$ target BETELGEUSE', start: 1.05, cps: 34, tone: 'amber' },
  { text: '  ra 05:55:10   dec +07:24:25', start: 1.6, cps: 48, tone: 'dim' },
  { text: '  dist 642.5 ly   class M2Iab', start: 2.1, cps: 48, tone: 'dim' },
  { text: '  last signal 2023-01-08', start: 2.6, cps: 48, tone: 'ember' },
  { text: '$ render --ascii', start: 3.15, cps: 30, tone: 'amber' },
];

function drawTerminal(ctx: CanvasRenderingContext2D, time: number) {
  const fade = 1 - phase(time, T.consoleEnd - 0.9, T.consoleEnd);
  if (fade <= 0) return;

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '10px "Fusion Pixel 10 Patch", "Fusion Pixel 10", monospace';

  ctx.fillStyle = C.amberDim;
  ctx.fillText('DEEP FIELD // OBSERVATORY', 12, 10);
  ctx.textAlign = 'right';
  ctx.fillText('LINK 04:12', W - 12, 10);
  ctx.textAlign = 'left';

  for (let i = 0; i < TERMINAL_LINES.length; i += 1) {
    const line = TERMINAL_LINES[i];
    const shown = Math.floor(clamp((time - line.start) * line.cps, 0, line.text.length));
    const y = 26 + i * 13;
    if (shown <= 0) continue;
    ctx.fillStyle = line.tone === 'ember' ? C.ember : line.tone === 'amber' ? C.amber : '#b79a63';
    ctx.fillText(line.text.slice(0, shown), 12, y);
    const isLast = i === TERMINAL_LINES.length - 1;
    if (shown < line.text.length || (isLast && Math.floor(time * 4) % 2 === 0)) {
      const width = ctx.measureText(line.text.slice(0, shown)).width;
      ctx.fillStyle = C.amber;
      ctx.fillRect(12 + Math.ceil(width) + 2, y + 1, 4, 8);
    }
  }

  const sy = (time * 46) % H;
  ctx.globalAlpha = fade * 0.18;
  ctx.fillStyle = C.amber;
  ctx.fillRect(10, Math.floor(sy), W - 20, 1);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 字符参宿四
// ---------------------------------------------------------------------------

const ASCII_CHARS = ' .:-=+*#%@';
const ASCII_CELL = 5;
const STAR_R = 56;

type AsciiCell = { dx: number; dy: number; ch: string; color: string; v: number; gx: number; gy: number };

function buildAscii(): AsciiCell[] {
  const cells: AsciiCell[] = [];
  let seed = 0x5e1;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  const reach = Math.ceil((STAR_R + 8) / ASCII_CELL);
  for (let gy = -reach; gy <= reach; gy += 1) {
    for (let gx = -reach; gx <= reach; gx += 1) {
      const dx = gx * ASCII_CELL;
      const dy = gy * ASCII_CELL;
      const r = Math.hypot(dx, dy);
      if (r > STAR_R + 8) continue;
      const inside = r <= STAR_R;
      const limb = inside ? Math.sqrt(Math.max(0, 1 - (r / STAR_R) ** 2)) : 0;
      const v = inside ? limb * (0.55 + 0.45 * rand()) : 0.08 + rand() * 0.16;
      const ch = ASCII_CHARS[Math.min(ASCII_CHARS.length - 1, Math.floor(v * (ASCII_CHARS.length - 1)))];
      if (ch === ' ') continue;
      const color = inside
        ? v > 0.8
          ? C.core
          : v > 0.58
            ? C.hot
            : v > 0.35
              ? C.mid
              : C.edge
        : C.amberDim;
      cells.push({ dx, dy, ch, color, v, gx, gy });
    }
  }
  return cells;
}

const ASCII_CELLS = buildAscii();

function drawAsciiStar(ctx: CanvasRenderingContext2D, time: number) {
  const morph = phase(time, T.realStart + 0.15, 8.0);
  if (morph >= 1 || time < T.asciiStart) return;
  const reveal = (STAR_R + 8) * easeOut(phase(time, T.asciiStart, T.asciiEnd), 1.4);
  if (reveal <= 0) return;
  const frame = Math.floor(time * 9);

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '5px "Fusion Pixel 10 Patch", "Fusion Pixel 10", monospace';
  for (const cell of ASCII_CELLS) {
    const r = Math.hypot(cell.dx, cell.dy);
    if (r > reveal) continue;
    const jitter = hash(cell.gx, cell.gy, frame) > 0.972;
    if (jitter) continue;
    const edge = 1 - phase(r, STAR_R * 0.82, STAR_R + 8);
    ctx.globalAlpha = (1 - morph) * (0.35 + 0.65 * cell.v) * (0.5 + 0.5 * edge);
    ctx.fillStyle = cell.color;
    ctx.fillText(cell.ch, CX + cell.dx - 2, CY + cell.dy);
  }

  if (time < T.realStart + 0.3) {
    ctx.globalAlpha = 0.8 * (1 - phase(time, T.realStart, T.realStart + 0.3));
    ctx.fillStyle = C.amber;
    ctx.fillRect(CX - 2, CY + STAR_R + 9, 4, 7);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 真实恒星
// ---------------------------------------------------------------------------

const STAR_BANDS = [C.dark, C.edge, C.mid, C.hot, C.core, C.white];

function drawStar(ctx: CanvasRenderingContext2D, time: number) {
  if (time > T.boom + 0.14) return;
  const appear = easeOut(phase(time, T.realStart, 6.7), 2);
  if (appear <= 0) return;
  const collapse = phase(time, T.collapseStart, T.collapseEnd);
  const scale = (0.28 + 0.72 * appear) * (1 - easeIn(collapse, 2.4) * 0.985);
  const R = Math.max(0.6, STAR_R * scale);
  const pulse = 1 + Math.sin(time * 1.15) * 0.012 * (1 - collapse);
  const radius = R * pulse;
  const frame = Math.floor(time * 7);

  ctx.save();
  ctx.globalAlpha = 1;
  for (let y = -Math.ceil(radius); y <= Math.ceil(radius); y += 1) {
    for (let x = -Math.ceil(radius); x <= Math.ceil(radius); x += 1) {
      const r = Math.hypot(x, y);
      if (r > radius) continue;
      const limb = Math.sqrt(Math.max(0, 1 - (r / radius) ** 2));
      const n1 = hash(Math.floor(x / 3) + 64, Math.floor(y / 3) + 64, frame);
      const n2 = 0.5 + 0.5 * Math.sin(x * 0.17 + y * 0.11 + time * 0.8);
      const heat = limb * (0.62 + 0.28 * n1 + 0.1 * n2);
      const spot = Math.sin(x * 0.045 + time * 0.2) * Math.sin(y * 0.05 - time * 0.17);
      const band = Math.min(5, Math.max(0, Math.floor((heat + spot * 0.05) * 6)));
      ctx.fillStyle = STAR_BANDS[band];
      ctx.fillRect(CX + x, CY + y, 1, 1);
    }
  }

  if (collapse < 0.3 && radius > 10) {
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = C.hot;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      const start = hash(i, 4, 8) * Math.PI * 2 + time * 0.04;
      ctx.beginPath();
      ctx.arc(CX, CY, radius + 4 + hash(i, 5, 9) * 6, start, start + 0.35 + hash(i, 6, 2) * 0.35);
      ctx.stroke();
    }
  }

  if (collapse < 0.35) {
    for (let i = 0; i < 54; i += 1) {
      const angle = hash(i, 1, 5) * Math.PI * 2 + time * 0.05;
      const distance = radius + 2 + hash(i, 2, 7) * 12;
      const a = (1 - collapse) * (0.15 + hash(i, 3, 9) * 0.45);
      ctx.globalAlpha = a;
      px(ctx, CX + Math.cos(angle) * distance, CY + Math.sin(angle) * distance, hash(i, 4, 11) > 0.5 ? C.hot : C.ember);
    }
  }

  if (collapse > 0.35) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.white;
    const core = Math.max(1, Math.round(5 * (collapse - 0.35) / 0.65));
    ctx.fillRect(CX - core, CY - core, core * 2, core * 2);
    ctx.globalAlpha = 0.7 * collapse;
    ctx.fillStyle = C.core;
    ctx.fillRect(CX - 18, CY, 36, 1);
    ctx.fillRect(CX, CY - 18, 1, 36);
  }
  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, time: number) {
  const a = phase(time, T.realStart, T.realStart + 0.5) * (1 - phase(time, 8.05, 8.4));
  if (a <= 0) return;
  const flicker = time > 7.95 ? 0.4 + 0.6 * hash(Math.floor(time * 30), 1, 2) : 1;
  ctx.save();
  ctx.globalAlpha = a * 0.7 * flicker;
  const c = C.amberDim;
  corner(ctx, 8, 8, 1, 1, 7, c);
  corner(ctx, W - 8, 8, -1, 1, 7, c);
  corner(ctx, 8, H - 8, 1, -1, 7, c);
  corner(ctx, W - 8, H - 8, -1, -1, 7, c);

  ctx.font = '10px "Fusion Pixel 10 Patch", "Fusion Pixel 10", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = C.amberDim;
  ctx.fillText('OBJECT  BETELGEUSE', 16, H - 14);
  ctx.textAlign = 'right';
  ctx.fillText('642.5 LY', W - 16, H - 14);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('DEEP FIELD', 16, 14);
  ctx.textAlign = 'right';
  ctx.fillText('04:12:07', W - 16, 14);

  ctx.globalAlpha = a * 0.2;
  ctx.strokeStyle = C.amber;
  ctx.lineWidth = 1;
  for (const [a0, a1] of [
    [0.15, 1.35],
    [1.72, 2.92],
    [3.29, 4.49],
    [4.86, 6.06],
  ]) {
    ctx.beginPath();
    ctx.arc(CX, CY, STAR_R + 8, a0, a1);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 爆炸
// ---------------------------------------------------------------------------

const BOOM_PARTICLES = Array.from({ length: 150 }, (_, index) => {
  const angle = hash(index, 3, 11) * Math.PI * 2;
  const speed = 34 + hash(index, 7, 23) * 210;
  return {
    angle,
    speed,
    size: hash(index, 13, 5) > 0.82 ? 2 : 1,
    color: hash(index, 19, 31) > 0.6 ? C.core : hash(index, 23, 41) > 0.4 ? C.hot : C.ember,
  };
});

function drawBoom(ctx: CanvasRenderingContext2D, time: number) {
  const t = time - T.boom;
  if (t < 0 || t > 2.2) return;

  const flash = t < 0.04 ? 1 : Math.max(0, 1 - (t - 0.04) / 0.18);
  if (flash > 0) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = C.white;
    ctx.fillRect(0, 0, W, H);
  }

  const fire = Math.max(0, 1 - t / 0.55);
  if (fire > 0) {
    for (let i = 0; i < 10; i += 1) {
      const angle = hash(i, 1, 2) * Math.PI * 2;
      const distance = t * (40 + hash(i, 3, 4) * 80);
      const radius = 6 + t * (30 + hash(i, 5, 6) * 40);
      ctx.globalAlpha = fire * 0.32;
      ctx.fillStyle = i % 2 === 0 ? C.hot : C.mid;
      ctx.beginPath();
      ctx.arc(CX + Math.cos(angle) * distance, CY + Math.sin(angle) * distance, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = fire;
    ctx.fillStyle = C.core;
    ctx.beginPath();
    ctx.arc(CX, CY, 6 + t * 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.hot;
    ctx.globalAlpha = fire * 0.6;
    ctx.beginPath();
    ctx.arc(CX, CY, 10 + t * 130, 0, Math.PI * 2);
    ctx.fill();
  }

  // 放射状火舌，让爆炸不是一颗光滑的火球。
  const spokes = Math.max(0, 1 - t / 0.95);
  if (spokes > 0) {
    ctx.globalAlpha = spokes;
    ctx.lineWidth = 1;
    for (let i = 0; i < 38; i += 1) {
      const angle = hash(i, 2, 5) * Math.PI * 2;
      const inner = 8 + t * 26;
      const outer = inner + 16 + t * (70 + hash(i, 4, 8) * 110);
      ctx.strokeStyle = i % 3 === 0 ? C.core : i % 3 === 1 ? C.hot : C.ember;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(angle) * inner, CY + Math.sin(angle) * inner);
      ctx.lineTo(CX + Math.cos(angle) * outer, CY + Math.sin(angle) * outer);
      ctx.stroke();
    }
    for (let i = 0; i < 26; i += 1) {
      const angle = hash(i, 10, 12) * Math.PI * 2;
      const distance = 12 + t * (80 + hash(i, 14, 16) * 150);
      const x = CX + Math.cos(angle) * distance;
      const y = CY + Math.sin(angle) * distance + t * t * 10;
      ctx.globalAlpha = spokes * (0.5 + hash(i, 18, 20) * 0.5);
      ctx.fillStyle = hash(i, 22, 24) > 0.5 ? C.core : C.ember;
      const size = hash(i, 26, 28) > 0.75 ? 3 : 2;
      ctx.fillRect(Math.round(x), Math.round(y), size, size);
    }
  }

  const ring = (offset: number, width: number, color: string, speed: number) => {
    const rt = t - offset;
    if (rt <= 0) return;
    const r = rt * speed;
    const a = Math.max(0, 1 - rt / 1.8);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.stroke();
  };
  ring(0.02, 2, C.core, 190);
  ring(0.12, 1, C.ember, 160);
  ring(0.26, 1, C.edge, 130);

  for (const particle of BOOM_PARTICLES) {
    const distance = 6 + particle.speed * t;
    const x = CX + Math.cos(particle.angle) * distance;
    const y = CY + Math.sin(particle.angle) * distance + t * t * 12;
    const a = Math.max(0, 1 - t / 2.0);
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = particle.color;
    ctx.fillRect(Math.round(x), Math.round(y), particle.size, particle.size);
    if (particle.size > 1) {
      ctx.globalAlpha = a * 0.35;
      ctx.fillRect(Math.round(x - Math.cos(particle.angle) * 3), Math.round(y - Math.sin(particle.angle) * 3), 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// 星云
// ---------------------------------------------------------------------------

const NEBULA_COLORS = ['#4a6fb8', '#8a5ab8', '#c05a88', '#c07840', '#4aa89a'];

type Mote = { angle: number; base: number; speed: number; size: number; color: string; phase: number; twinkle: number };

const NEBULA_MOTES: Mote[] = Array.from({ length: 260 }, (_, index) => ({
  angle: hash(index, 1, 2) * Math.PI * 2,
  base: 5 + hash(index, 3, 4) * 150,
  speed: 1.5 + hash(index, 5, 6) * 8,
  size: hash(index, 7, 8) > 0.88 ? 2 : 1,
  color: [C.core, C.hot, C.rose, C.teal, C.violet, C.blue][Math.floor(hash(index, 9, 10) * 6)],
  phase: hash(index, 11, 12) * Math.PI * 2,
  twinkle: 0.4 + hash(index, 13, 14) * 0.6,
}));

const FILAMENTS: Array<Array<[number, number]>> = [
  [[-26, -8], [-82, -52], [-150, -18], [-210, -70]],
  [[-18, 12], [-70, 48], [-142, 34], [-198, 84]],
  [[22, -12], [78, -58], [144, -26], [206, -76]],
  [[18, 14], [68, 52], [136, 40], [196, 92]],
  [[-8, -22], [-34, -86], [34, -104], [72, -62]],
];

const FIXED_STARS = Array.from({ length: 9 }, (_, index) => ({
  x: 18 + hash(index, 1, 3) * (W - 36),
  y: 14 + hash(index, 2, 4) * (H - 28),
  phase: hash(index, 5, 6) * Math.PI * 2,
  size: hash(index, 7, 8) > 0.7 ? 2 : 1,
}));

const NEBULA_SRC = import.meta.env.BASE_URL + 'assets-private/bg/bg_dlc_nebula.png';
const nebulaImage = typeof Image === 'undefined' ? null : new Image();
if (nebulaImage) {
  nebulaImage.decoding = 'async';
  nebulaImage.src = NEBULA_SRC;
}

function valueNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

function drawNebula(ctx: CanvasRenderingContext2D, time: number) {
  const alpha = phase(time, T.nebulaStart, T.nebulaFull) * (1 - phase(time, 16.0, 19.1)) * (1 - 0.22 * phase(time, 13.1, 14.8));
  if (alpha <= 0) return;

  ctx.save();

  if (nebulaImage && nebulaImage.complete && nebulaImage.naturalWidth > 0) {
    // 预渲染的像素星云：缓慢漂移、轻微旋转，再叠加现场闪烁的尘埃。
    ctx.save();
    ctx.globalAlpha = alpha;
    const fall = phase(time, T.fallStart, T.fallEnd);
    const zoom = 1.08 + fall * 0.34;
    ctx.translate(CX + Math.sin(time * 0.09) * 2, CY + Math.cos(time * 0.07) * 1.5);
    ctx.rotate(Math.sin(time * 0.05) * 0.006 + fall * 0.018);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(nebulaImage, (-W * zoom) / 2, (-H * zoom) / 2, W * zoom, H * zoom);
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
  } else {
    // 没有预渲染图时的程序化兜底：低频噪声 + 4px 云块。
    const base = ctx.createRadialGradient(CX, CY, 0, CX, CY, 190);
    base.addColorStop(0, '#2a1a28');
    base.addColorStop(0.4, '#16142e');
    base.addColorStop(0.75, '#0c1220');
    base.addColorStop(1, '#07070c');
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    for (let y = 0; y < H; y += 4) {
      for (let x = 0; x < W; x += 4) {
        const n = 0.64 * valueNoise(x / 44, y / 44, 3) + 0.36 * valueNoise(x / 16, y / 16, 5);
        if (n < 0.32) continue;
        const dx = x - CX;
        const dy = y - CY;
        const r = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const spin = Math.sin(angle * 3 + r * 0.08 - time * 0.34 + n * 4);
        const falloff = clamp(1 - r / 250, 0.12, 1);
        const a = alpha * (0.035 + 0.18 * n) * (0.4 + 0.6 * Math.max(0, spin)) * falloff;
        if (a <= 0.005) continue;
        ctx.globalAlpha = a;
        const colorN = valueNoise(x / 64, y / 64, 9);
        ctx.fillStyle = NEBULA_COLORS[Math.floor(colorN * NEBULA_COLORS.length) % NEBULA_COLORS.length];
        ctx.fillRect(x, y, 4, 4);
      }
    }

    const glow = ctx.createRadialGradient(CX, CY, 0, CX, CY, 96);
    glow.addColorStop(0, 'rgba(255, 196, 106, 0.24)');
    glow.addColorStop(0.35, 'rgba(226, 80, 47, 0.08)');
    glow.addColorStop(1, 'rgba(7, 7, 12, 0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = glow;
    ctx.fillRect(CX - 96, CY - 96, 192, 192);

    ctx.lineWidth = 1;
    for (let i = 0; i < FILAMENTS.length; i += 1) {
      const f = FILAMENTS[i];
      const a = alpha * (0.1 + 0.1 * (0.5 + 0.5 * Math.sin(time * 0.32 + i * 1.7)));
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      ctx.strokeStyle = i % 2 === 0 ? C.violet : C.teal;
      ctx.beginPath();
      ctx.moveTo(CX + f[0][0], CY + f[0][1]);
      ctx.bezierCurveTo(
        CX + f[1][0] + Math.sin(time * 0.2 + i) * 4,
        CY + f[1][1],
        CX + f[2][0],
        CY + f[2][1] + Math.cos(time * 0.18 + i) * 4,
        CX + f[3][0],
        CY + f[3][1],
      );
      ctx.stroke();
    }
  }

  for (const mote of NEBULA_MOTES) {
    const angle = mote.angle + time * 0.018;
    const radius = mote.base + time * mote.speed;
    const x = CX + Math.cos(angle) * radius + Math.sin(time * 0.35 + mote.phase) * 3;
    const y = CY + Math.sin(angle) * radius + Math.cos(time * 0.3 + mote.phase) * 2;
    if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
    const twinkle = 0.55 + 0.45 * Math.sin(time * 2.6 + mote.phase);
    ctx.globalAlpha = alpha * (0.25 + 0.55 * twinkle) * mote.twinkle;
    ctx.fillStyle = mote.color;
    ctx.fillRect(Math.round(x), Math.round(y), mote.size, mote.size);
    if (mote.size > 1) {
      ctx.globalAlpha *= 0.4;
      ctx.fillRect(Math.round(x) - 2, Math.round(y), 5, 1);
      ctx.fillRect(Math.round(x), Math.round(y) - 2, 1, 5);
    }
  }

  for (const star of FIXED_STARS) {
    const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * 2.2 + star.phase));
    ctx.globalAlpha = alpha * twinkle * 0.8;
    ctx.fillStyle = C.white;
    ctx.fillRect(star.x, star.y, star.size, star.size);
    ctx.globalAlpha = alpha * twinkle * 0.25;
    ctx.fillRect(star.x - 2, star.y, 5, 1);
    ctx.fillRect(star.x, star.y - 2, 1, 5);
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 分子结构
// ---------------------------------------------------------------------------

type Atom = { x: number; y: number; label?: string };
type Bond = { a: number; b: number; order: 1 | 2 };
type MoleculePart = { atoms: Atom[]; bonds: Bond[] };
type Molecule = MoleculePart & { name: string };

function ring(
  cx: number,
  cy: number,
  r: number,
  n: number,
  rot: number,
  labels: Record<number, string> = {},
  doubles: number[] = [],
): MoleculePart {
  const atoms: Atom[] = Array.from({ length: n }, (_, index) => {
    const angle = rot + (index * Math.PI * 2) / n;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      label: labels[index],
    };
  });
  const bonds: Bond[] = atoms.map((_, index) => ({
    a: index,
    b: (index + 1) % n,
    order: doubles.includes(index) ? 2 : 1,
  }));
  return { atoms, bonds };
}

function chain(points: Array<[number, number]>, labels: Record<number, string> = {}, doubles: number[] = []): MoleculePart {
  const atoms: Atom[] = points.map(([x, y], index) => ({ x, y, label: labels[index] }));
  const bonds: Bond[] = points.slice(0, -1).map((_, index) => ({
    a: index,
    b: index + 1,
    order: doubles.includes(index) ? 2 : 1,
  }));
  return { atoms, bonds };
}

function merge(...parts: MoleculePart[]): MoleculePart {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  for (const part of parts) {
    const offset = atoms.length;
    atoms.push(...part.atoms);
    for (const bond of part.bonds) bonds.push({ a: bond.a + offset, b: bond.b + offset, order: bond.order });
  }
  return { atoms, bonds };
}

function molecule(name: string, ...parts: MoleculePart[]): Molecule {
  return { name, ...merge(...parts) };
}

const DMT = molecule(
  'DMT',
  ring(-10, 0, 13, 6, Math.PI / 6, {}, [0, 2, 4]),
  chain(
    [
      [1.26, -6.5],
      [13, -12],
      [23, -4],
      [31, -13],
    ],
    { 3: 'N' },
    [1],
  ),
  chain([
    [31, -13],
    [39, -7],
  ], { 1: 'CH3' }),
  chain([
    [31, -13],
    [39, -19],
  ], { 1: 'CH3' }),
  chain([
    [13, -12],
    [7, -19],
    [1.26, -6.5],
  ], { 1: 'N' }),
);

const HARMINE = molecule(
  'HARMINE',
  ring(-18, 0, 11, 6, 0, {}, [0, 2, 4]),
  ring(4, 0, 11, 6, 0, { 1: 'N' }, [0, 2, 4]),
  ring(-7, -17, 9, 5, Math.PI / 2, { 2: 'N' }, [0]),
  chain([
    [15, 0],
    [23, 8],
  ], { 1: 'O' }),
);

const DXM = molecule(
  'DXM',
  ring(-22, 0, 10, 6, 0, {}, [0, 2, 4]),
  ring(0, 0, 10, 6, 0, { 1: 'N' }, [0, 2, 4]),
  ring(22, 0, 10, 6, 0, {}, [0, 2, 4]),
  chain([
    [-12, -8],
    [0, -18],
    [12, -8],
  ]),
  chain([
    [0, 10],
    [0, 20],
  ], { 1: 'O' }),
);

const PSILOCIN = molecule(
  'PSILOCIN',
  ring(-14, 0, 10, 6, 0, {}, [0, 2, 4]),
  ring(4, 0, 9, 5, -Math.PI / 2, { 2: 'N' }, [0]),
  chain([
    [13, -4],
    [22, -11],
    [29, -5],
  ], { 2: 'OH' }),
  chain([
    [13, 5],
    [22, 12],
    [29, 6],
  ], { 2: 'N' }),
);

const CAFFEINE = molecule(
  'CAFFEINE',
  ring(-10, 0, 10, 6, 0, { 1: 'N', 3: 'N' }, [0, 2, 4]),
  ring(10, 0, 9, 5, -Math.PI / 2, { 1: 'N', 3: 'N' }, [0]),
  chain([
    [-10, -10],
    [-10, -19],
  ], { 1: 'O' }),
  chain([
    [10, 9],
    [10, 18],
  ], { 1: 'O' }),
);

const EPHEDRINE = molecule(
  'EPHEDRINE',
  ring(-16, 0, 10, 6, 0, {}, [0, 2, 4]),
  chain([
    [-6, 0],
    [4, -8],
    [14, 0],
    [24, -8],
  ], { 1: 'OH', 3: 'NH' }),
  chain([
    [24, -8],
    [31, -15],
  ]),
);

const SEROTONIN = molecule(
  'SEROTONIN',
  ring(-14, 0, 10, 6, 0, {}, [0, 2, 4]),
  ring(4, 0, 9, 5, -Math.PI / 2, { 2: 'N' }, [0]),
  chain([
    [-24, -5],
    [-31, -12],
  ], { 1: 'OH' }),
  chain([
    [13, 3],
    [22, 9],
    [29, 3],
  ], { 2: 'N' }),
);

const MORPHINE = molecule(
  'MORPHINE',
  ring(-18, 0, 8, 6, 0, {}, [0, 2, 4]),
  ring(0, 0, 8, 6, 0, { 1: 'N' }, [0, 2, 4]),
  ring(18, 0, 8, 6, 0, {}, [0, 2, 4]),
  chain([
    [-9, -7],
    [0, -16],
    [9, -7],
  ]),
  chain([
    [0, 8],
    [0, 16],
  ], { 1: 'OH' }),
);

const NICOTINE = molecule(
  'NICOTINE',
  ring(-12, 0, 9, 6, 0, { 1: 'N' }, [0, 2, 4]),
  ring(10, 0, 8, 5, -Math.PI / 2, { 2: 'N' }, [0]),
  chain([
    [17, 4],
    [25, 10],
  ]),
);

const THC = molecule(
  'THC',
  ring(-18, 0, 8, 6, 0, {}, [0, 2, 4]),
  ring(0, 0, 8, 6, 0, {}, [0, 2, 4]),
  ring(18, 0, 8, 6, 0, {}, [0, 2, 4]),
  chain([
    [24, -4],
    [32, -10],
    [40, -16],
  ]),
);

const MESCALINE = molecule(
  'MESCALINE',
  ring(-14, 0, 9, 6, 0, {}, [0, 2, 4]),
  chain([
    [-14, -9],
    [-14, -17],
  ], { 1: 'O' }),
  chain([
    [-5, 8],
    [-5, 16],
  ], { 1: 'O' }),
  chain([
    [4, 0],
    [13, -7],
    [21, -1],
  ], { 2: 'N' }),
);

const LSD = molecule(
  'LSD',
  ring(-18, 0, 8, 6, 0, {}, [0, 2, 4]),
  ring(0, 0, 8, 6, 0, { 1: 'N' }, [0, 2, 4]),
  ring(-9, -14, 7, 5, Math.PI / 2, { 2: 'N' }, [0]),
  chain([
    [8, 0],
    [17, 7],
    [25, 1],
  ], { 2: 'N' }),
  chain([
    [25, 1],
    [32, 7],
  ]),
);

const KETAMINE = molecule(
  'KETAMINE',
  ring(0, 0, 10, 6, 0, {}, [0, 2, 4]),
  chain([
    [-4, -9],
    [-4, -18],
  ], { 1: 'O' }),
  chain([
    [6, 4],
    [15, 10],
  ], { 1: 'N' }),
  chain([
    [15, 10],
    [23, 4],
  ]),
);

const MDMA = molecule(
  'MDMA',
  ring(-10, 0, 9, 6, 0, {}, [0, 2, 4]),
  ring(-2, 10, 6, 5, 0, { 1: 'O', 3: 'O' }, [0]),
  chain([
    [0, 0],
    [9, -7],
    [17, -1],
  ], { 2: 'N' }),
  chain([
    [17, -1],
    [25, -7],
  ]),
);

type PlacedMolecule = {
  mol: Molecule;
  x: number;
  y: number;
  scale: number;
  phase: number;
  angle: number;
  spin: number;
  drift: number;
  central?: boolean;
};

const MOLECULE_POOL: Molecule[] = [
  HARMINE, DXM, PSILOCIN, CAFFEINE, EPHEDRINE,
  SEROTONIN, MORPHINE, NICOTINE, THC, MESCALINE,
  LSD, KETAMINE, MDMA,
];

const OUTER_MOLECULES: Array<{ mol: Molecule; x: number; y: number; small?: boolean }> = [
  { mol: HARMINE, x: CX - 91, y: CY - 43 },
  { mol: DXM, x: CX + 88, y: CY - 40 },
  { mol: PSILOCIN, x: CX - 85, y: CY + 45 },
  { mol: CAFFEINE, x: CX + 90, y: CY + 43 },
  { mol: EPHEDRINE, x: CX - 2, y: CY - 73 },
  { mol: SEROTONIN, x: CX - 122, y: CY - 12 },
  { mol: MORPHINE, x: CX + 122, y: CY - 10 },
  { mol: NICOTINE, x: CX - 72, y: CY + 78 },
  { mol: THC, x: CX + 72, y: CY + 78 },
  { mol: MESCALINE, x: CX - 126, y: CY + 20 },
  { mol: LSD, x: CX + 126, y: CY + 22 },
  ...Array.from({ length: 11 }, (_, index) => {
    const angle = (index / 11) * Math.PI * 2 + hash(index, 21, 22) * 0.45;
    const rx = 116 + hash(index, 23, 24) * 38;
    const ry = 55 + hash(index, 25, 26) * 26;
    return {
      mol: MOLECULE_POOL[(index * 3 + 1) % MOLECULE_POOL.length],
      x: CX + Math.cos(angle) * rx,
      y: CY + Math.sin(angle) * ry,
      small: true,
    };
  }),
];

const MOLECULES: PlacedMolecule[] = [
  { mol: DMT, x: CX, y: CY, scale: 1.15, phase: 0, angle: -0.12, spin: 0, drift: 0, central: true },
  ...OUTER_MOLECULES.map((item, index) => ({
    ...item,
    scale: item.small ? 0.18 + hash(index, 31, 32) * 0.07 : 0.28 + hash(index, 1, 2) * 0.09,
    phase: hash(index, 3, 4) * Math.PI * 2,
    angle: hash(index, 5, 6) * Math.PI * 2,
    spin: (hash(index, 7, 8) - 0.5) * 0.42,
    drift: item.small ? 2 + hash(index, 9, 10) * 3 : 3 + hash(index, 9, 10) * 4,
  })),
];

function drawMolecule(
  ctx: CanvasRenderingContext2D,
  mol: Molecule,
  x: number,
  y: number,
  scale: number,
  angle: number,
  alpha: number,
  highlight: boolean,
  showName: boolean,
  showLabels = true,
) {
  if (alpha <= 0.005) return;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const project = (atom: Atom): [number, number] => [
    x + (atom.x * cos - atom.y * sin) * scale,
    y + (atom.x * sin + atom.y * cos) * scale,
  ];

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = highlight ? C.paper : '#b79a63';
  ctx.lineWidth = highlight ? 1.4 : 1;
  ctx.lineCap = 'round';

  for (const bond of mol.bonds) {
    const [x1, y1] = project(mol.atoms[bond.a]);
    const [x2, y2] = project(mol.atoms[bond.b]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    if (bond.order === 2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const ox = (-dy / len) * 2;
      const oy = (dx / len) * 2;
      ctx.beginPath();
      ctx.moveTo(x1 + ox, y1 + oy);
      ctx.lineTo(x2 + ox, y2 + oy);
      ctx.stroke();
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const atom of mol.atoms) {
    if (!atom.label || !showLabels) continue;
    const [ax, ay] = project(atom);
    ctx.font = highlight ? '6px "Fusion Pixel 10 Patch", "Fusion Pixel 10", monospace' : '5px "Fusion Pixel 10 Patch", "Fusion Pixel 10", monospace';
    ctx.fillStyle = 'rgba(7, 7, 12, 0.68)';
    ctx.fillText(atom.label, ax + 0.7, ay + 0.7);
    ctx.fillStyle = highlight ? C.core : C.paper;
    ctx.fillText(atom.label, ax, ay);
  }

  if (showName) {
    ctx.font = '5px "Fusion Pixel 10 Patch", "Fusion Pixel 10", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(7, 7, 12, 0.68)';
    ctx.fillText(mol.name, x + 0.7, y + 22 + 12 * scale + 0.7);
    ctx.fillStyle = highlight ? C.amber : 'rgba(243, 234, 216, 0.82)';
    ctx.fillText(mol.name, x, y + 22 + 12 * scale);
  }
  ctx.restore();
}

function drawMolecules(ctx: CanvasRenderingContext2D, time: number) {
  if (time < T.moleculeStart) return;
  const fall = phase(time, T.fallStart, T.fallEnd);
  const centerFade = 1 - phase(time, 16.2, 18.6);

  for (let i = 1; i < MOLECULES.length; i += 1) {
    const item = MOLECULES[i];
    const p = phase(time, T.moleculeStart + i * 0.045, T.moleculeStart + 0.8 + i * 0.045);
    if (p <= 0) continue;
    const rise = fall * (58 + item.drift * 7);
    const mx = item.x + Math.sin(time * (0.32 + item.spin * 0.2) + item.phase) * item.drift;
    const my = item.y + Math.cos(time * (0.28 + item.spin * 0.2) + item.phase) * item.drift * 0.75 - rise;
    ctx.save();
    ctx.globalAlpha = 0.032 * p * centerFade;
    ctx.strokeStyle = C.amber;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(mx, my);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 1; i < MOLECULES.length; i += 1) {
    const item = MOLECULES[i];
    const p = phase(time, T.moleculeStart + i * 0.045, T.moleculeStart + 0.8 + i * 0.045);
    if (p <= 0) continue;
    const rise = fall * (58 + item.drift * 7);
    const mx = item.x + Math.sin(time * (0.32 + item.spin * 0.2) + item.phase) * item.drift;
    const my = item.y + Math.cos(time * (0.28 + item.spin * 0.2) + item.phase) * item.drift * 0.75 - rise;
    const alpha = p * (1 - phase(time, 16.2, 18.5));
    const rot = item.angle + Math.sin(time * 0.4 + item.phase) * 0.14 + time * item.spin;
    drawMolecule(ctx, item.mol, mx, my, item.scale * (1 - fall * 0.22), rot, alpha, false, false, false);
  }

  const centerIn = phase(time, T.moleculeStart, T.moleculeFull);
  if (centerIn <= 0) return;
  const idle = 1 - fall;
  const fallEase = easeIn(fall, 1.7);
  const grow = 1 + fallEase * 2.4;
  const land = phase(time, 18.45, 19.15);
  const dmtScale = 1.15 * grow * (1 - land * 0.93);
  const dmtX = CX + Math.sin(time * 0.55) * 2.2 * idle + Math.sin(fall * Math.PI * 2.2) * 7;
  const dmtY = CY + Math.cos(time * 0.5) * 1.8 * idle - 6 * fall + fallEase * 64;
  const dmtAngle = -0.12 + Math.sin(time * 0.45) * 0.05 * idle + fallEase * 5.4;
  const dmtAlpha = centerIn * (1 - phase(time, T.bowlLand - 0.05, T.bowlLand + 0.12));

  // 中心压一层柔和的暗晕，让 DMT 的白色骨架不被星云核心吃掉。
  const halo = ctx.createRadialGradient(dmtX, dmtY, 8, dmtX, dmtY, 74);
  halo.addColorStop(0, 'rgba(7, 7, 12, 0.62)');
  halo.addColorStop(0.62, 'rgba(7, 7, 12, 0.34)');
  halo.addColorStop(1, 'rgba(7, 7, 12, 0)');
  ctx.save();
  ctx.globalAlpha = centerIn * (1 - phase(time, 19.2, 19.8)) * (1 - fall * 0.72);
  ctx.fillStyle = halo;
  ctx.fillRect(dmtX - 74, dmtY - 74, 148, 148);
  ctx.globalAlpha = 0.1 * centerIn * (1 - fall * 0.8);
  ctx.fillStyle = C.amber;
  ctx.beginPath();
  ctx.arc(dmtX, dmtY, 40 + Math.sin(time * 1.8) * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 拖影：让下坠有速度，而不只是“变大”。
  if (fall > 0.1) {
    for (let k = 1; k <= 2; k += 1) {
      const tf = Math.max(0, fall - k * 0.045);
      const te = easeIn(tf, 1.7);
      const tx = CX + Math.sin(time * 0.55) * 2.2 * (1 - tf) + Math.sin(tf * Math.PI * 2.2) * 7;
      const ty = CY + Math.cos(time * 0.5) * 1.8 * (1 - tf) - 6 * tf + te * 64 - k * 8;
      const ts = 1.15 * (1 + te * 2.4) * (1 - land * 0.93);
      const ta = dmtAlpha * 0.085 * (1 - land);
      drawMolecule(ctx, DMT, tx, ty, ts, -0.12 + te * 5.4, ta, true, false, false);
    }
  }

  drawMolecule(ctx, DMT, dmtX, dmtY, dmtScale, dmtAngle, dmtAlpha, true, false, land < 0.35);

}

// ---------------------------------------------------------------------------
// 下坠
// ---------------------------------------------------------------------------

const FALL_LINES = Array.from({ length: 88 }, (_, index) => ({
  angle: hash(index, 1, 2) * Math.PI * 2,
  radius: 22 + hash(index, 3, 4) * 180,
  length: 26 + hash(index, 5, 6) * 120,
  color: hash(index, 7, 8) > 0.6 ? C.hot : hash(index, 9, 10) > 0.5 ? C.blue : C.violet,
}));

function drawFall(ctx: CanvasRenderingContext2D, time: number) {
  const fall = phase(time, T.fallStart, T.fallEnd);
  const fade = 1 - phase(time, 19.15, 19.55);
  if (fall <= 0 || fade <= 0) return;

  ctx.save();
  ctx.globalAlpha = fall * fade * 0.42;
  ctx.strokeStyle = C.hot;
  ctx.lineWidth = 1;
  const stretch = 0.45 + fall * 1.8;
  for (const line of FALL_LINES) {
    const r = line.radius + fall * 80;
    const x1 = CX + Math.cos(line.angle) * r;
    const y1 = CY + Math.sin(line.angle) * r;
    const x2 = CX + Math.cos(line.angle) * (r + line.length * stretch);
    const y2 = CY + Math.sin(line.angle) * (r + line.length * stretch);
    ctx.strokeStyle = line.color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 向下坠落的竖向雨线。
  for (let i = 0; i < 24; i += 1) {
    const x = hash(i, 11, 12) * W;
    const y = (hash(i, 13, 14) * H + time * (34 + hash(i, 15, 16) * 42)) % H;
    const len = 8 + fall * 38;
    ctx.globalAlpha = fall * fade * (0.07 + hash(i, 17, 18) * 0.12);
    ctx.strokeStyle = i % 3 === 0 ? C.paper : C.hot;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - len);
    ctx.stroke();
  }

  for (let i = 0; i < 4; i += 1) {
    const r = 26 + ((time * 46 + i * 34) % 150);
    const a = fall * fade * 0.18 * (1 - r / 180);
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    ctx.strokeStyle = i % 2 === 0 ? C.amberDim : C.violet;
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 碗
// ---------------------------------------------------------------------------

function bowlPosition(time: number) {
  const appear = phase(time, T.bowlStart, T.bowlLand);
  const e = easeOut(appear, 2);
  return {
    appear,
    y: H + 28 - e * 74,
    rx: 58 + e * 22,
    ry: 13 + e * 10,
  };
}

function drawBowl(ctx: CanvasRenderingContext2D, time: number) {
  if (time < T.bowlStart || time >= T.shatter) return;
  const { appear, y, rx, ry } = bowlPosition(time);
  if (appear <= 0) return;
  const tremble = phase(time, 20.22, T.shatter);
  const by = y + (tremble > 0 ? (hash(Math.floor(time * 42), 1, 2) - 0.5) * 2.4 * tremble : 0);

  ctx.save();
  ctx.globalAlpha = phase(time, T.bowlStart, T.bowlStart + 0.35);

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(CX, by + ry * 0.8, rx * 1.02, ry * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();

  // 碗身：一个向下收的陶碗，而不是一块厚圆盘。
  const bodyBottom = by + ry * 1.55;
  const bodyGrad = ctx.createLinearGradient(0, by, 0, bodyBottom);
  bodyGrad.addColorStop(0, '#c9b18c');
  bodyGrad.addColorStop(0.55, '#a98963');
  bodyGrad.addColorStop(1, '#6b523d');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(CX - rx * 0.92, by + 1);
  ctx.quadraticCurveTo(CX - rx * 0.82, by + ry * 1.35, CX - rx * 0.34, bodyBottom);
  ctx.lineTo(CX + rx * 0.34, bodyBottom);
  ctx.quadraticCurveTo(CX + rx * 0.82, by + ry * 1.35, CX + rx * 0.92, by + 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(CX, bodyBottom + 3, rx * 0.46, Math.max(2, ry * 0.22), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a4635';
  ctx.beginPath();
  ctx.ellipse(CX, bodyBottom, rx * 0.33, Math.max(2, ry * 0.17), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = C.ceramic;
  ctx.beginPath();
  ctx.ellipse(CX, by, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b89a74';
  ctx.beginPath();
  ctx.ellipse(CX, by + 2, rx - 4, ry - 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(CX, by + 5, rx - 9, ry - 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = C.liquid;
  ctx.beginPath();
  ctx.ellipse(CX, by + 5, rx - 13, ry - 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const liquidGlow = ctx.createRadialGradient(CX, by + 5, 0, CX, by + 5, rx * 0.62);
  liquidGlow.addColorStop(0, 'rgba(226, 80, 47, 0.24)');
  liquidGlow.addColorStop(1, 'rgba(226, 80, 47, 0)');
  ctx.globalAlpha = 0.9 * phase(time, T.bowlStart + 0.2, T.bowlStart + 0.8);
  ctx.fillStyle = liquidGlow;
  ctx.fillRect(CX - rx, by - ry, rx * 2, ry * 2);

  ctx.globalAlpha = 0.55 * phase(time, T.bowlStart, T.bowlStart + 0.35);
  ctx.strokeStyle = C.cream;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(CX, by - 1, rx - 2, ry - 1, 0, Math.PI * 1.02, Math.PI * 1.98);
  ctx.stroke();

  const swirlColors = [C.hot, C.rose, C.teal, C.violet];
  for (let i = 0; i < 4; i += 1) {
    ctx.globalAlpha = 0.16 * phase(time, T.bowlStart + 0.2, T.bowlStart + 0.7);
    ctx.strokeStyle = swirlColors[i];
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(
      CX + Math.sin(time * 0.7 + i) * (rx * 0.13),
      by + 5 + Math.cos(time * 0.6 + i) * (ry * 0.14),
      rx * (0.24 + i * 0.065),
      ry * (0.2 + i * 0.05),
      time * 0.2 + i * 1.7,
      0,
      Math.PI * 1.4,
    );
    ctx.stroke();
  }

  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(CX, by, rx - 3, ry - 2, 0, Math.PI * 0.9, Math.PI * 1.45);
  ctx.stroke();

  if (tremble > 0) {
    ctx.globalAlpha = 0.55 * tremble;
    ctx.strokeStyle = C.white;
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2 + 0.2;
      const r0 = 18 + hash(i, 1, 2) * 14;
      const r1 = rx * (0.6 + hash(i, 3, 4) * 0.3);
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(angle) * r0, by + 3 + Math.sin(angle) * r0 * 0.24);
      ctx.lineTo(CX + Math.cos(angle) * r1, by + 3 + Math.sin(angle) * r1 * 0.24);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBowlFront(ctx: CanvasRenderingContext2D, time: number) {
  if (time < T.bowlStart || time >= T.shatter) return;
  const { y } = bowlPosition(time);

  const steam = phase(time, T.bowlStart + 0.4, 20.4);
  if (steam > 0) {
    ctx.save();
    ctx.globalAlpha = 0.16 * steam;
    ctx.strokeStyle = C.paper;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i += 1) {
      const x = CX - 24 + i * 24;
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.bezierCurveTo(
        x + Math.sin(time * 1.1 + i) * 8,
        y - 22,
        x - Math.sin(time * 0.9 + i) * 10,
        y - 34,
        x + 3,
        y - 44,
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  const ripple = phase(time, 19.05, 20.0);
  if (ripple > 0 && ripple < 1) {
    ctx.save();
    ctx.globalAlpha = 0.55 * (1 - ripple);
    ctx.strokeStyle = C.hot;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(CX, y + 3, 8 + ripple * 62, 2 + ripple * 15, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha *= 0.5;
    ctx.beginPath();
    ctx.ellipse(CX, y + 3, 4 + ripple * 40, 1 + ripple * 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// 碎裂与泼洒
// ---------------------------------------------------------------------------

const SHARDS = Array.from({ length: 18 }, (_, index) => ({
  a0: (index / 18) * Math.PI * 2,
  a1: ((index + 1) / 18) * Math.PI * 2,
  speed: 38 + hash(index, 1, 2) * 115,
  spin: (hash(index, 3, 4) - 0.5) * 7,
}));

const SPLASH_COLORS = [C.hot, C.rose, C.teal, C.violet, C.amber, C.blue, C.paper];

type Droplet = { angle: number; speed: number; delay: number; size: number; color: string; life: number };

const DROPLETS: Droplet[] = Array.from({ length: 520 }, (_, index) => ({
  angle: hash(index, 1, 2) * Math.PI * 2,
  speed: 24 + hash(index, 3, 4) * 146,
  delay: hash(index, 5, 6) * 0.3,
  size: hash(index, 7, 8) > 0.86 ? 3 : hash(index, 7, 8) > 0.55 ? 2 : 1,
  color: SPLASH_COLORS[Math.floor(hash(index, 9, 10) * SPLASH_COLORS.length)],
  life: 1.4 + hash(index, 11, 12) * 0.9,
}));

const LENS_BLOBS = Array.from({ length: 12 }, (_, index) => ({
  x: 18 + hash(index, 1, 2) * (W - 36),
  y: 14 + hash(index, 3, 4) * (H - 28),
  r: 7 + hash(index, 5, 6) * 22,
  delay: hash(index, 7, 8) * 0.55,
  color: SPLASH_COLORS[Math.floor(hash(index, 9, 10) * SPLASH_COLORS.length)],
}));

const DRIPS = Array.from({ length: 18 }, (_, index) => ({
  x: hash(index, 1, 2) * W,
  delay: 0.35 + hash(index, 3, 4) * 0.8,
  len: 12 + hash(index, 5, 6) * 64,
  speed: 18 + hash(index, 7, 8) * 54,
  color: SPLASH_COLORS[Math.floor(hash(index, 9, 10) * SPLASH_COLORS.length)],
}));

function drawShatter(ctx: CanvasRenderingContext2D, time: number) {
  const t = time - T.shatter;
  if (t < 0 || t > 2.8) return;

  if (t < 0.07) {
    ctx.globalAlpha = 1 - t / 0.07;
    ctx.fillStyle = C.core;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  // 从碗心炸开的液体喷流。
  const burst = Math.max(0, 1 - t / 0.9);
  if (burst > 0) {
    ctx.globalAlpha = burst * 0.75;
    ctx.lineWidth = 1;
    for (let i = 0; i < 44; i += 1) {
      const angle = hash(i, 1, 2) * Math.PI * 2;
      const reach = 12 + t * (90 + hash(i, 3, 4) * 120);
      const x1 = CX + Math.cos(angle) * 6;
      const y1 = 152 + Math.sin(angle) * 3;
      const x2 = CX + Math.cos(angle) * reach;
      const y2 = 152 + Math.sin(angle) * reach * 0.55 + 34 * t * t;
      ctx.strokeStyle = SPLASH_COLORS[i % SPLASH_COLORS.length];
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.globalAlpha = burst * 0.3;
    ctx.fillStyle = C.hot;
    ctx.beginPath();
    ctx.ellipse(CX, 152, 8 + t * 90, 3 + t * 26, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const shard of SHARDS) {
    const mid = (shard.a0 + shard.a1) / 2;
    const ox = CX + Math.cos(mid) * 30;
    const oy = 152 + Math.sin(mid) * 5;
    const x = ox + Math.cos(mid) * shard.speed * t;
    const y = oy + Math.sin(mid) * shard.speed * t * 0.65 + 52 * t * t;
    const a = Math.max(0, 1 - t / 1.7);
    if (a <= 0) continue;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(shard.spin * t);
    ctx.globalAlpha = a;
    ctx.fillStyle = C.ceramic;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(shard.a0 - mid) * 28, Math.sin(shard.a0 - mid) * 9);
    ctx.lineTo(Math.cos(shard.a1 - mid) * 32, Math.sin(shard.a1 - mid) * 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = C.ceramicShade;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  for (const drop of DROPLETS) {
    const dt = t - drop.delay;
    if (dt <= 0 || dt > drop.life) continue;
    const x = CX + Math.cos(drop.angle) * drop.speed * dt;
    const y = 152 + Math.sin(drop.angle) * drop.speed * dt * 0.55 + 58 * dt * dt;
    if (x < -6 || x > W + 6 || y < -6 || y > H + 6) continue;
    const a = 1 - dt / drop.life;
    ctx.globalAlpha = a;
    ctx.fillStyle = drop.color;
    ctx.fillRect(Math.round(x), Math.round(y), drop.size, drop.size);
    ctx.globalAlpha = a * 0.35;
    ctx.strokeStyle = drop.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(drop.angle) * 7, y - Math.sin(drop.angle) * 7);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  for (const blob of LENS_BLOBS) {
    const dt = t - blob.delay;
    if (dt < 0 || dt > 1.6) continue;
    const grow = easeOut(clamp(dt / 0.45, 0, 1), 2);
    const r = blob.r * (0.3 + 0.7 * grow);
    const a = 0.22 * (1 - dt / 1.6);
    ctx.globalAlpha = a;
    ctx.fillStyle = blob.color;
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = a * 0.8;
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.arc(blob.x - r * 0.3, blob.y - r * 0.35, Math.max(1, r * 0.16), 0, Math.PI * 2);
    ctx.fill();
  }

  // 从屏幕上沿往下淌的液体。
  for (const drip of DRIPS) {
    const dt = t - drip.delay;
    if (dt <= 0 || dt > 1.5) continue;
    const y = -18 + dt * drip.speed;
    ctx.globalAlpha = 0.2 * (1 - dt / 1.5);
    ctx.fillStyle = drip.color;
    ctx.fillRect(Math.round(drip.x), Math.round(y), 1, drip.len);
  }

  const black = phase(time, 22.12, 22.78) * (1 - phase(time, 22.78, 23.3));
  if (black > 0) {
    ctx.globalAlpha = black;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------------
// 夏日街道
// ---------------------------------------------------------------------------

const SUMMER_SRC = import.meta.env.BASE_URL + 'assets-private/bg/bg_dlc_summer_street.png';
const summerStreet = typeof Image === 'undefined' ? null : new Image();
if (summerStreet) {
  summerStreet.decoding = 'async';
  summerStreet.src = SUMMER_SRC;
}

function drawFallbackStreet(ctx: CanvasRenderingContext2D, time: number) {
  const sky = ['#f7c98b', '#f3b07a', '#e88d6a', '#d76f5a'];
  for (let i = 0; i < sky.length; i += 1) {
    ctx.fillStyle = sky[i];
    ctx.fillRect(0, i * 24, W, 25);
  }

  ctx.fillStyle = 'rgba(255, 235, 190, 0.34)';
  ctx.beginPath();
  ctx.arc(252, 54, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe6aa';
  ctx.beginPath();
  ctx.arc(252, 54, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4f5a3a';
  ctx.fillRect(0, 86, W, 12);
  for (let i = 0; i < 12; i += 1) {
    const x = i * 34 - 8;
    ctx.fillStyle = i % 3 === 0 ? '#3f4b31' : '#596344';
    ctx.beginPath();
    ctx.arc(x, 86, 13 + (i % 4) * 3, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  for (let y = 98; y < 156; y += 6) {
    const k = (y - 98) / 58;
    ctx.fillStyle = 'rgb(' + Math.round(106 + k * 24) + ', ' + Math.round(150 + k * 12) + ', ' + Math.round(148 + k * 10) + ')';
    ctx.fillRect(0, y, W, 6);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = C.hot;
    const sway = Math.sin(y * 0.4 + time * 0.5) * 7;
    ctx.fillRect(232 + sway, y + 1, 24, 1);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = '#c8a477';
  ctx.fillRect(0, 156, W, H - 156);
  ctx.fillStyle = '#a78259';
  for (let x = 0; x < W; x += 24) ctx.fillRect(x, 156, 1, H - 156);

  ctx.fillStyle = '#3a2f28';
  ctx.fillRect(0, 148, W, 2);
  for (let x = 8; x < W; x += 28) ctx.fillRect(x, 138, 2, 22);

  ctx.fillStyle = '#3a2f28';
  ctx.fillRect(54, 132, 46, 22);
  ctx.fillStyle = '#d9c9a8';
  ctx.fillRect(58, 128, 38, 7);
  ctx.fillStyle = C.rose;
  ctx.beginPath();
  ctx.moveTo(50, 128);
  ctx.lineTo(78, 108);
  ctx.lineTo(106, 128);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.cream;
  ctx.fillRect(72, 138, 3, 3);
  ctx.fillRect(82, 138, 3, 3);
}

function drawStreet(ctx: CanvasRenderingContext2D, time: number) {
  const p = phase(time, T.streetStart, T.streetFull);
  if (p <= 0) return;

  ctx.save();
  ctx.globalAlpha = p;
  ctx.imageSmoothingEnabled = false;
  if (summerStreet && summerStreet.complete && summerStreet.naturalWidth > 0) {
    ctx.drawImage(summerStreet, 0, 0, W, H);
  } else {
    drawFallbackStreet(ctx, time);
  }

  ctx.globalAlpha = p * 0.1;
  ctx.fillStyle = C.hot;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = p * 0.35;
  for (let i = 0; i < 18; i += 1) {
    const x = (hash(i, 1, 2) * W + time * (2 + hash(i, 3, 4) * 5)) % W;
    const y = 30 + hash(i, 5, 6) * 110 + Math.sin(time * 0.6 + i) * 6;
    ctx.fillStyle = C.paper;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  ctx.restore();
}

function drawTitle(ctx: CanvasRenderingContext2D, time: number) {
  const p = phase(time, T.titleStart, T.titleStart + 1.0);
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha = p;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 一层很淡的暗带，保证字压在夕阳上也读得清。
  const band = ctx.createLinearGradient(0, 28, 0, 114);
  band.addColorStop(0, 'rgba(7, 7, 12, 0)');
  band.addColorStop(0.32, 'rgba(7, 7, 12, 0.42)');
  band.addColorStop(1, 'rgba(7, 7, 12, 0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 28, W, 88);

  ctx.font = '24px "Fusion Pixel 12 Patch", "Fusion Pixel 12", monospace';
  ctx.fillStyle = 'rgba(7, 7, 12, 0.6)';
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) {
    ctx.fillText('稍尽春风', CX + ox, 68 + oy);
  }
  ctx.fillStyle = C.paper;
  ctx.fillText('稍尽春风', CX, 68);

  // 底部压一条很轻的暗带，把制作署名放到画面边缘。
  const bottom = ctx.createLinearGradient(0, 166, 0, 198);
  bottom.addColorStop(0, 'rgba(7, 7, 12, 0)');
  bottom.addColorStop(1, 'rgba(7, 7, 12, 0.42)');
  ctx.fillStyle = bottom;
  ctx.fillRect(0, 166, W, 32);

  ctx.font = '10px "Fusion Pixel 10 Patch", "Fusion Pixel 10", monospace';
  ctx.fillStyle = 'rgba(7, 7, 12, 0.7)';
  ctx.fillText('A GAME BY HARUKAZE', CX + 1, 185);
  ctx.fillStyle = 'rgba(243, 234, 216, 0.82)';
  ctx.fillText('A GAME BY HARUKAZE', CX, 184);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 合成
// ---------------------------------------------------------------------------

export function drawDlc(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const boomShake = phase(time, T.boom, T.boom + 0.5);
  const shatterShake = phase(time, T.shatter, T.shatter + 0.42);
  const shake = Math.max(boomShake > 0 && boomShake < 1 ? 1 - boomShake : 0, shatterShake > 0 && shatterShake < 1 ? 1 - shatterShake : 0);
  if (shake > 0) {
    const amp = 3.4 * shake;
    ctx.translate(
      (hash(Math.floor(time * 60), 1, 1) - 0.5) * amp,
      (hash(2, Math.floor(time * 60), 3) - 0.5) * amp,
    );
  }

  ctx.fillStyle = C.bg;
  ctx.fillRect(-8, -8, W + 16, H + 16);

  drawTerminal(ctx, time);
  // 先画真实恒星，再让字符盖在上面；字符退场时恒星从字缝里亮起来。
  drawStar(ctx, time);
  drawAsciiStar(ctx, time);
  drawHud(ctx, time);

  drawBoom(ctx, time);
  drawNebula(ctx, time);

  drawBowl(ctx, time);
  drawFall(ctx, time);
  drawMolecules(ctx, time);
  drawBowlFront(ctx, time);

  drawShatter(ctx, time);
  drawStreet(ctx, time);
  drawTitle(ctx, time);

  grain(ctx, time);
  scanlines(ctx, time > T.streetStart ? 0.055 : 0.12);
  ctx.restore();
}
