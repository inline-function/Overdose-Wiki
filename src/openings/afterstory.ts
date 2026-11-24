import type { CanvasOpening } from './registry';

export const AFTERSTORY_DURATION = 27;

const W = 352;
const H = 198;

const C = {
  void: '#07060a',
  bg: '#11131a',
  desk: '#3a2a20',
  deskLight: '#5a4030',
  deskDark: '#241b17',
  ink: '#17151f',
  ink2: '#2b2735',
  paper: '#e8e0cc',
  paper2: '#d6ccb4',
  paper3: '#f3ead8',
  muted: '#8c8270',
  red: '#a62b20',
  redWash: '#f2d9cf',
  blue: '#4a6fa5',
  blueDark: '#2f4f8f',
  green: '#4f6b4a',
  greenDark: '#3f6b3f',
  yellow: '#d9a441',
  yellow2: '#f0c866',
  sky: '#8fa8b8',
  white: '#ffffff',
};

export type AfterstorySfx =
  | 'hiss'
  | 'origin'
  | 'tick'
  | 'paper'
  | 'axis'
  | 'heartbeat'
  | 'write'
  | 'focus'
  | 'appear'
  | 'stamp'
  | 'crack'
  | 'shatter'
  | 'cut'
  | 'vanish'
  | 'fall'
  | 'spin'
  | 'shimmer'
  | 'burst';

export const AFTERSTORY_SFX: Array<{ t: number; key: AfterstorySfx }> = [
  { t: 0.12, key: 'hiss' },
  { t: 0.42, key: 'origin' },
  { t: 1.05, key: 'tick' },
  { t: 1.58, key: 'paper' },
  { t: 2.25, key: 'paper' },
  { t: 3.05, key: 'stamp' },
  { t: 4.55, key: 'axis' },
  { t: 5.2, key: 'tick' },
  { t: 6.15, key: 'heartbeat' },
  { t: 7.05, key: 'write' },
  { t: 8.55, key: 'paper' },
  { t: 9.3, key: 'focus' },
  { t: 9.85, key: 'appear' },
  { t: 10.35, key: 'appear' },
  { t: 10.9, key: 'paper' },
  { t: 11.55, key: 'stamp' },
  { t: 12.25, key: 'focus' },
  { t: 13.9, key: 'stamp' },
  { t: 14.05, key: 'stamp' },
  { t: 15.25, key: 'crack' },
  { t: 15.55, key: 'shatter' },
  { t: 16.65, key: 'cut' },
  { t: 17.2, key: 'stamp' },
  { t: 18.0, key: 'tick' },
  { t: 19.1, key: 'stamp' },
  { t: 20.15, key: 'heartbeat' },
  { t: 20.9, key: 'vanish' },
  { t: 21.5, key: 'paper' },
  { t: 22.2, key: 'fall' },
  { t: 23.0, key: 'spin' },
  { t: 24.55, key: 'stamp' },
  { t: 25.15, key: 'write' },
  { t: 26.0, key: 'shimmer' },
  { t: 26.55, key: 'burst' },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smooth(t: number) {
  const value = clamp(t);
  return value * value * (3 - 2 * value);
}

function easeOut(t: number, power = 2.2) {
  return 1 - Math.pow(1 - clamp(t), power);
}

function easeOutBack(t: number) {
  const value = clamp(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

function phase(time: number, from: number, to: number) {
  return clamp((time - from) / Math.max(0.001, to - from));
}

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function fill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 1,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
  ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
  ctx.stroke();
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'left',
  weight = 400,
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Cubic 11", "Fusion Pixel 8", "MS Gothic", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(value, Math.round(x), Math.round(y));
}

function withAlpha(ctx: CanvasRenderingContext2D, alpha: number, draw: () => void) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  draw();
  ctx.restore();
}

function objectIn(
  t: number,
  start: number,
  duration: number,
  dx: number,
  dy: number,
  draw: () => void,
  ctx: CanvasRenderingContext2D,
  rotate = 0,
) {
  const p = easeOut(phase(t, start, start + duration), 2.4);
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha = p;
  ctx.translate((1 - p) * dx, (1 - p) * dy);
  ctx.rotate((1 - p) * rotate);
  draw();
  ctx.restore();
}

const DUST = (() => {
  const random = seeded(0xa17e);
  return Array.from({ length: 38 }, () => ({
    x: random() * W,
    y: random() * H,
    speed: 1.5 + random() * 5,
    size: random() < 0.2 ? 2 : 1,
    alpha: 0.12 + random() * 0.32,
  }));
})();

const SHARDS = (() => {
  const random = seeded(0x5a7d);
  return Array.from({ length: 34 }, (_, index) => ({
    angle: random() * Math.PI * 2,
    speed: 26 + random() * 110,
    size: 3 + random() * 9,
    spin: (random() - 0.5) * 4,
    delay: random() * 0.28,
    color: index % 5 === 0 ? C.red : C.paper,
  }));
})();

const VORTEX = (() => {
  const random = seeded(0x91c3);
  return Array.from({ length: 46 }, (_, index) => ({
    angle: random() * Math.PI * 2,
    radius: 18 + random() * 120,
    size: 1 + Math.floor(random() * 3),
    speed: 0.8 + random() * 2.2,
    phase: random() * Math.PI * 2,
    color: index % 4 === 0 ? C.red : index % 3 === 0 ? C.blue : C.paper,
  }));
})();

type CameraKey = { t: number; zoom: number; x: number; y: number; rot: number };

// 一组连续关键帧。相邻段用 Catmull-Rom，镜头不会在段落交界处瞬移。
// 0–4.6 从 CRT 屏幕拉回桌面；4.6–16.4 缓慢推向地图/窗口/档案；20.6–24.1 吸回屏幕。
const CAMERA_KEYS: CameraKey[] = [
  { t: 0, zoom: 2.82, x: 0, y: 0, rot: 0 },
  { t: 1.4, zoom: 2.3, x: 0, y: 0, rot: 0 },
  { t: 4.6, zoom: 1.0, x: 0, y: 0, rot: 0 },
  { t: 8.6, zoom: 1.075, x: -6, y: -2, rot: 0.002 },
  { t: 12.9, zoom: 1.2, x: 5, y: -3, rot: -0.002 },
  { t: 16.4, zoom: 1.27, x: 7, y: 2, rot: 0.003 },
  { t: 20.6, zoom: 1.2, x: 2, y: 1, rot: 0 },
  { t: 24.1, zoom: 0.08, x: 0, y: 0, rot: 0 },
  { t: 27, zoom: 1, x: 0, y: 0, rot: 0 },
];

function catmull(a: number, b: number, c: number, d: number, u: number) {
  const u2 = u * u;
  const u3 = u2 * u;
  return 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
}

function cameraAt(t: number) {
  const clamped = clamp(t, CAMERA_KEYS[0].t, CAMERA_KEYS[CAMERA_KEYS.length - 1].t);
  let index = 0;
  while (index < CAMERA_KEYS.length - 2 && clamped > CAMERA_KEYS[index + 1].t) index += 1;
  const k0 = CAMERA_KEYS[Math.max(0, index - 1)];
  const k1 = CAMERA_KEYS[index];
  const k2 = CAMERA_KEYS[index + 1];
  const k3 = CAMERA_KEYS[Math.min(CAMERA_KEYS.length - 1, index + 2)];
  const u = smooth((clamped - k1.t) / Math.max(0.001, k2.t - k1.t));

  let zoom = Math.max(0.06, catmull(k0.zoom, k1.zoom, k2.zoom, k3.zoom, u));
  let x = catmull(k0.x, k1.x, k2.x, k3.x, u);
  let y = catmull(k0.y, k1.y, k2.y, k3.y, u);
  let rot = catmull(k0.rot, k1.rot, k2.rot, k3.rot, u);

  // 手持感始终存在；冲击只做平滑包络，不做突然开关。
  const drift = 0.28 + 0.12 * Math.sin(t * 0.7);
  x += Math.sin(t * 0.83 + 0.7) * drift;
  y += Math.cos(t * 1.07 + 1.9) * drift;
  rot += Math.sin(t * 0.61) * 0.0008;

  const pulse = (center: number, halfWidth: number) => {
    const d = Math.abs(t - center);
    return d >= halfWidth ? 0 : smooth(1 - d / halfWidth);
  };
  const shake =
    0.7 * pulse(2.05, 0.38) +
    1.2 * pulse(4.1, 0.3) +
    0.9 * pulse(7.4, 0.34) +
    1.7 * pulse(14.05, 0.4) +
    2.2 * pulse(15.45, 0.35) +
    1.1 * pulse(16.9, 0.5) +
    1.0 * pulse(20.55, 0.4);
  if (shake > 0) {
    x += Math.sin(t * 91) * shake;
    y += Math.cos(t * 73) * shake;
    rot += Math.sin(t * 53) * 0.0026 * shake;
  }
  return { zoom, x, y, rot };
}

function drawCrtFlash(ctx: CanvasRenderingContext2D, t: number) {
  // 16.4 的横带入口用短促的 CRT 黑场遮断；
  // 20.6 由横带归零连续接进吸积，24.1 由 CRT 关机线接进标题，不再需要整屏闪白。
  const transitions = [
    { at: 16.4, width: 0.14, strength: 0.3 },
  ];
  for (const item of transitions) {
    const d = Math.abs(t - item.at);
    if (d >= item.width) continue;
    const p = smooth(1 - d / item.width);
    ctx.save();
    ctx.globalAlpha = p * item.strength;
    fill(ctx, 0, 0, W, H, C.void);
    ctx.globalAlpha = p * 0.7;
    fill(ctx, 0, 96, W, 1, C.paper3);
    ctx.globalAlpha = p * 0.34;
    fill(ctx, 0, 92, W, 1, C.sky);
    ctx.globalAlpha = p * 0.28;
    fill(ctx, 0, 100, W, 1, C.red);
    ctx.restore();
  }
}

function drawBoot(ctx: CanvasRenderingContext2D, t: number) {
  if (t > 1.9) return;
  const fade = 1 - smooth(phase(t, 1.2, 1.9));
  if (fade <= 0) return;
  ctx.save();
  ctx.globalAlpha = fade;
  fill(ctx, 0, 0, W, H, C.void);

  // CRT 受压、聚焦、撑开
  const lineP = easeOut(phase(t, 0.05, 0.72), 2.1);
  const wobble = Math.sin(t * 31) * 0.5;
  fill(ctx, 0, 94 + wobble, W, 1, 'rgba(232,224,204,0.12)');
  fill(ctx, 0, 101 + wobble, W, 1, 'rgba(232,224,204,0.08)');
  const lineW = W * lineP;
  fill(ctx, (W - lineW) / 2, 97, lineW, 2, C.paper3);
  fill(ctx, (W - lineW * 0.7) / 2, 95, lineW * 0.7, 1, C.white);
  fill(ctx, (W - lineW * 0.55) / 2, 99, lineW * 0.55, 1, 'rgba(143,168,184,0.75)');

  if (t > 0.18) {
    fill(ctx, 174, 96, 4, 4, C.white);
    fill(ctx, 171, 95, 10, 1, C.paper3);
  }

  const dates = [
    { value: '2026.01', color: C.paper3, y: 64, dx: 0 },
    { value: '2026.05.31', color: C.redWash, y: 82, dx: 6 },
    { value: '2026.02.02', color: C.sky, y: 118, dx: -5 },
  ];
  for (let i = 0; i < dates.length; i += 1) {
    const item = dates[i];
    const p = smooth(phase(t, 0.3 + i * 0.16, 0.75 + i * 0.16));
    if (p <= 0) continue;
    const jitter = Math.sin(t * 57 + i * 4) > 0.75 ? (i - 1) * 3 : 0;
    ctx.globalAlpha = fade * p * (0.8 + 0.2 * Math.sin(t * 19 + i));
    text(ctx, item.value, W / 2 + item.dx + jitter, item.y, 8, item.color, 'center');
  }
  ctx.globalAlpha = fade;

  // 静电与扫描线
  for (let i = 0; i < 12; i += 1) {
    const y = (i * 37 + t * 140) % H;
    fill(ctx, 0, y, W, i % 3 === 0 ? 2 : 1, i % 2 === 0 ? 'rgba(232,224,204,0.1)' : 'rgba(166,43,32,0.12)');
  }
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 61 + t * 80) % W;
    const y = (i * 43 + Math.sin(t * 9 + i) * 20 + H) % H;
    fill(ctx, x, y, 1, 1, 'rgba(232,224,204,0.28)');
  }
  text(ctx, 'CRT 08 / SIGNAL', 8, 8, 5, 'rgba(143,168,184,0.55)');
  text(ctx, 'CH 08', W - 8, H - 12, 5, 'rgba(143,168,184,0.42)', 'right');
  ctx.restore();
}

function drawRoom(ctx: CanvasRenderingContext2D) {
  fill(ctx, 0, 0, W, H, C.bg);
  fill(ctx, 0, 0, W, 112, '#101219');
  for (let y = 0; y < 112; y += 22) {
    fill(ctx, 0, y, W, 1, 'rgba(232,224,204,0.045)');
    fill(ctx, 0, y + 1, W, 21, y % 44 === 0 ? '#12151c' : '#101219');
  }

  // 软木板
  fill(ctx, 258, 24, 78, 70, '#3b3025');
  fill(ctx, 258, 24, 78, 3, '#554435');
  fill(ctx, 258, 91, 78, 3, '#241c16');
  for (let i = 0; i < 7; i += 1) {
    const px = 265 + (i % 4) * 17;
    const py = 32 + Math.floor(i / 4) * 21;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate((i % 3 - 1) * 0.05);
    fill(ctx, 0, 0, 13, 16, i % 3 === 0 ? C.paper2 : C.paper);
    fill(ctx, 3, 4, 7, 1, C.muted);
    fill(ctx, 3, 7, 5, 1, C.muted);
    fill(ctx, 6, 0, 1, 2, C.red);
    ctx.restore();
  }

  // 桌面
  fill(ctx, 0, 112, W, H - 112, C.deskDark);
  for (let i = 0; i < 7; i += 1) {
    const y = 113 + i * 12;
    fill(ctx, 0, y, W, 11, i % 2 === 0 ? C.desk : '#30231b');
    fill(ctx, 0, y, W, 1, 'rgba(232,224,204,0.08)');
    line(ctx, 12 + i * 29, y + 5, 92 + i * 19, y + 4, 'rgba(11,10,16,0.25)');
    line(ctx, 210 - i * 7, y + 8, 304 + i * 5, y + 7, 'rgba(11,10,16,0.2)');
  }
  fill(ctx, 0, 112, W, 3, '#6b4c37');
}

function drawScreen(ctx: CanvasRenderingContext2D, t: number) {
  const x = 134;
  const y = 54;
  const w = 84;
  const h = 52;
  fill(ctx, x, y, w, h, '#0a1918');
  const flicker = 0.82 + 0.12 * Math.sin(t * 23) + 0.06 * Math.sin(t * 7.7);
  ctx.save();
  ctx.globalAlpha = clamp(flicker, 0.55, 1);
  for (let i = 0; i < 5; i += 1) {
    fill(ctx, x + 5, y + 9 + i * 8, 25 + (i * 13) % 38, 1, 'rgba(143,168,184,0.25)');
  }
  text(ctx, 'C:\\ARCHIVE', x + 5, y + 4, 5, '#8fa8b8');
  if (t < 2.3) {
    const dates = [
      { value: '2026.01', color: C.paper3, dx: 0, dy: 0 },
      { value: '2026.05.31', color: C.redWash, dx: 4, dy: 8 },
      { value: '2026.02.02', color: C.sky, dx: -2, dy: 16 },
    ];
    for (let i = 0; i < dates.length; i += 1) {
      const item = dates[i];
      const visible = t > 0.25 + i * 0.22;
      if (!visible) continue;
      const jitter = Math.sin(t * 47 + i * 3) > 0.82 ? (i - 1) * 2 : 0;
      text(ctx, item.value, x + w / 2 + item.dx + jitter, y + 17 + item.dy, 8, item.color, 'center');
    }
  } else {
    text(ctx, '档案 08 / 读取中', x + w / 2, y + 23, 7, C.paper3, 'center');
    text(ctx, '八回合 · 2026.01—05', x + w / 2, y + 34, 5, C.sky, 'center');
    fill(ctx, x + 20, y + 44, 44, 2, 'rgba(240,200,102,0.45)');
    if (Math.sin(t * 9) > 0) fill(ctx, x + 68, y + 43, 3, 4, C.paper3);
  }
  fill(ctx, x, y, w, 1, 'rgba(232,224,204,0.2)');
  for (let sy = y + 2; sy < y + h; sy += 3) {
    fill(ctx, x, sy, w, 1, 'rgba(0,0,0,0.13)');
  }
  ctx.restore();
}

function drawMonitor(ctx: CanvasRenderingContext2D, t: number) {
  objectIn(t, 1.05, 0.7, 0, -52, () => {
    fill(ctx, 119, 43, 114, 74, '#22252b');
    fill(ctx, 123, 47, 106, 66, '#3a3f42');
    fill(ctx, 126, 50, 100, 60, '#15191b');
    drawScreen(ctx, t);
    fill(ctx, 154, 118, 44, 4, '#2b2735');
    fill(ctx, 166, 122, 20, 3, '#1b1a22');
    fill(ctx, 142, 127, 68, 4, '#24232a');
    fill(ctx, 132, 131, 88, 4, '#17161d');
    fill(ctx, 122, 43, 108, 2, 'rgba(255,255,255,0.12)');
  }, ctx);
}

function drawDeskObjects(ctx: CanvasRenderingContext2D, t: number) {
  // 左侧旧帖
  objectIn(t, 1.55, 0.62, -70, 10, () => {
    ctx.save();
    ctx.translate(19, 127);
    ctx.rotate(-0.08);
    fill(ctx, 0, 0, 62, 44, C.paper);
    fill(ctx, 2, 2, 58, 40, C.paper3);
    fill(ctx, 6, 7, 28, 2, C.ink2);
    for (let i = 0; i < 4; i += 1) fill(ctx, 6, 14 + i * 6, 42 - i * 3, 1, C.muted);
    fill(ctx, 43, 5, 12, 9, C.red);
    text(ctx, '旧帖', 49, 6, 5, C.redWash, 'center');
    ctx.restore();
  }, ctx, -0.04);

  // 中间文件夹
  objectIn(t, 1.8, 0.6, 0, 54, () => {
    ctx.save();
    ctx.translate(87, 126);
    ctx.rotate(0.04);
    fill(ctx, 0, 0, 50, 38, '#b88b3f');
    fill(ctx, 2, 3, 46, 33, '#d9a441');
    fill(ctx, 8, 9, 34, 2, '#6b4a22');
    fill(ctx, 8, 14, 22, 1, '#8a612a');
    ctx.restore();
  }, ctx, 0.03);

  // 右侧杯子
  objectIn(t, 2.1, 0.58, 76, 12, () => {
    fill(ctx, 248, 132, 18, 18, C.paper2);
    fill(ctx, 250, 134, 14, 14, '#b8a98e');
    fill(ctx, 252, 136, 10, 2, '#4a3a2c');
    ctx.beginPath();
    ctx.strokeStyle = C.paper2;
    ctx.lineWidth = 2;
    ctx.arc(267, 139, 6, -1.2, 1.2);
    ctx.stroke();
  }, ctx);

  // 右侧旧电话/线
  objectIn(t, 2.25, 0.58, 84, 32, () => {
    fill(ctx, 286, 126, 27, 17, '#25242b');
    fill(ctx, 289, 129, 21, 10, '#121218');
    fill(ctx, 290, 124, 19, 4, '#3c3b42');
    line(ctx, 300, 143, 320, 172, '#403d44', 1);
    line(ctx, 320, 172, 342, 164, '#403d44', 1);
  }, ctx);

  // 电线
  objectIn(t, 2.0, 0.7, 0, 40, () => {
    ctx.strokeStyle = '#2b2735';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(164, 136);
    ctx.bezierCurveTo(150, 160, 226, 184, 210, 198);
    ctx.stroke();
  }, ctx);
}

const MAP_LAYOUT = [
  ['mass', 'mass', 'mass', 'mass', 'mass', 'right', 'right', 'right', 'right', 'right'],
  ['mass', 'mass', 'mass', 'mass', 'mass', 'right', 'right', 'right', 'right', 'right'],
  ['left', 'left', 'left', 'left', 'mass', 'right', 'right', 'right', 'right', 'right'],
  ['left', 'left', 'left', 'left', 'mass', 'mass', 'right', 'right', 'right', 'right'],
  ['left', 'left', 'left', 'left', 'mass', 'mass', 'mass', 'mass', 'mass', 'mass'],
  ['left', 'left', 'left', 'left', 'mass', 'mass', 'mass', 'mass', 'mass', 'mass'],
  ['harm', 'harm', 'harm', 'left', 'mass', 'mass', 'mass', 'mass', 'mass', 'mass'],
  ['harm', 'harm', 'harm', 'harm', 'mass', 'mass', 'mass', 'mass', 'mass', 'mass'],
  ['harm', 'harm', 'harm', 'harm', 'mass', 'mass', 'mass', 'mass', 'mass', 'mass'],
  ['harm', 'harm', 'harm', 'harm', 'mass', 'mass', 'mass', 'mass', 'mass', 'mass'],
] as const;

const MAP_COLOR: Record<string, string> = {
  harm: '#4f6b4a',
  left: '#4a6fa5',
  right: '#b8872f',
  mass: '#d6ccb4',
};

function drawMap(ctx: CanvasRenderingContext2D, t: number) {
  const lift = smooth(phase(t, 4.75, 6.05));
  const x = 24 + (118 - 24) * lift;
  const y = 126 + (43 - 126) * lift;
  const w = 96 + (120 - 96) * lift;
  const h = 58 + (84 - 58) * lift;
  const appear = clamp(phase(t, 4.3, 4.7)) * (1 - smooth(phase(t, 13.0, 13.8)) * 0.7);
  if (appear <= 0) return;
  ctx.save();
  ctx.globalAlpha = appear;
  fill(ctx, x + 3, y + 4, w, h, 'rgba(0,0,0,0.35)');
  fill(ctx, x - 2, y - 2, w + 4, h + 4, C.ink);
  fill(ctx, x, y, w, h, '#0f1117');
  fill(ctx, x + 3, y + 3, w - 6, h - 6, '#171b23');

  const cw = (w - 8) / 10;
  const ch = (h - 8) / 10;
  const split = smooth(phase(t, 7.15, 8.7)) * (1 - 0.35 * smooth(phase(t, 9.2, 10.2)));
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 10; c += 1) {
      const faction = MAP_LAYOUT[r][c];
      const seed = r * 10 + c;
      const boot = easeOut(phase(t, 5.0 + seed * 0.011, 5.8 + seed * 0.011));
      if (boot <= 0) continue;
      const wave = Math.sin(t * 2.7 - (r + c) * 0.24) * 0.65 * lift;
      const qx = (c < 5 ? -1 : 1) * split * 7;
      const qy = (r < 5 ? -1 : 1) * split * 5;
      const cx = x + 4 + c * cw + qx + (1 - boot) * 4;
      const cy = y + 4 + r * ch + qy + wave + (1 - boot) * 10;
      const size = Math.max(1, cw - 1);
      fill(ctx, cx, cy, size, Math.max(1, ch - 1), MAP_COLOR[faction]);
      if (faction === 'mass') {
        fill(ctx, cx + 1, cy + 1, size - 2, 1, '#f3ead8');
        for (let d = 3; d < size; d += 3) fill(ctx, cx + d, cy + 2, 1, 1, '#8c8270');
      } else {
        fill(ctx, cx + 1, cy + 1, size - 2, 1, 'rgba(243,234,216,0.25)');
      }
      fill(ctx, cx, cy, 1, size - 1, 'rgba(11,10,16,0.35)');
    }
  }

  text(ctx, '倾向图 / 100', x + 4, y + 1, 5, C.paper2);
  text(ctx, '活跃 ' + (100 - MAP_LAYOUT.flat().filter((f) => f === 'mass').length), x + w - 4, y + 1, 5, C.sky, 'right');

  if (t > 7.5) {
    const s = smooth(phase(t, 7.5, 8.5));
    ctx.globalAlpha = appear * s * (0.65 + 0.25 * Math.sin(t * 10));
    line(ctx, x + 4, y + h - 4, x + w - 4, y + 4, C.red, 1);
    line(ctx, x + 4, y + 4, x + w - 4, y + h - 4, C.red, 1);
    line(ctx, x + w / 2, y + 4, x + w / 2, y + h - 4, C.yellow, 1);
  }
  ctx.restore();
}

function drawChair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  empty: boolean,
  alpha: number,
  rock = 0,
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rock);
  if (!empty) {
    fill(ctx, 0, 0, 17, 4, color);
    fill(ctx, 1, 4, 15, 9, color);
    fill(ctx, 2, 13, 13, 3, '#2b2735');
    fill(ctx, 1, 16, 2, 12, '#2b2735');
    fill(ctx, 14, 16, 2, 12, '#2b2735');
    fill(ctx, 5, 16, 2, 9, color);
  } else {
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(1, 0, 15, 13);
    ctx.strokeRect(2, 13, 13, 3);
    ctx.setLineDash([]);
    line(ctx, 1, 16, 1, 28, C.muted);
    line(ctx, 14, 16, 14, 28, C.muted);
  }
  ctx.restore();
}

function drawChairs(ctx: CanvasRenderingContext2D, t: number) {
  const colors = [C.green, C.green, C.blue, C.yellow, C.muted];
  for (let i = 0; i < 5; i += 1) {
    const start = 8.25 + i * 0.1;
    const p = easeOutBack(phase(t, start, start + 0.55));
    if (p <= 0) continue;
    const x = 42 + i * 54;
    const y = 164 + (1 - p) * 24;
    const rock = Math.sin(t * 5 + i) * 0.018 * (1 - clamp(phase(t, start + 0.55, start + 1.2)));
    drawChair(ctx, x, y, colors[i], i === 4, clamp(p), i === 4 ? 0 : rock);
    if (i === 4) {
      text(ctx, '空椅', x + 8, y + 30, 5, C.muted, 'center');
    }
  }
}

type WindowDef = {
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  from: 'top' | 'right' | 'bottom' | 'left';
  delay: number;
  rot: number;
  color: string;
};

const WINDOWS: WindowDef[] = [
  { kind: 'brief', x: 28, y: 34, w: 104, h: 64, from: 'top', delay: 8.85, rot: -0.04, color: C.paper3 },
  { kind: 'visit', x: 188, y: 28, w: 108, h: 70, from: 'right', delay: 9.1, rot: 0.035, color: C.paper },
  { kind: 'action', x: 22, y: 108, w: 96, h: 62, from: 'left', delay: 9.35, rot: 0.03, color: '#171b23' },
  { kind: 'council', x: 174, y: 106, w: 126, h: 72, from: 'bottom', delay: 9.6, rot: -0.025, color: C.paper3 },
  { kind: 'manual', x: 116, y: 78, w: 104, h: 62, from: 'top', delay: 9.9, rot: 0.04, color: C.paper2 },
  { kind: 'receipt', x: 246, y: 64, w: 84, h: 48, from: 'right', delay: 10.15, rot: -0.035, color: '#e4d8bf' },
];

function windowLines(ctx: CanvasRenderingContext2D, def: WindowDef, x: number, y: number, w: number, _h: number, t: number) {
  const dark = def.kind === 'action';
  const ink = dark ? C.paper2 : C.ink2;
  if (def.kind === 'brief') {
    fill(ctx, x + 5, y + 13, 32, 34, '#1b2a3a');
    fill(ctx, x + 7, y + 15, 28, 30, '#27445a');
    fill(ctx, x + 8, y + 17, 26, 2, C.sky);
    for (let i = 0; i < 4; i += 1) fill(ctx, x + 42, y + 16 + i * 6, w - 48 - i * 3, 1, ink);
    text(ctx, '本周简报', x + 5, y + 3, 5, C.red);
  } else if (def.kind === 'visit') {
    fill(ctx, x + 5, y + 14, 29, 32, '#3b3025');
    fill(ctx, x + 7, y + 16, 25, 28, '#d8b89a');
    fill(ctx, x + 13, y + 23, 13, 12, '#2a2a32');
    for (let i = 0; i < 5; i += 1) fill(ctx, x + 40, y + 16 + i * 6, w - 46 - (i % 2) * 8, 1, ink);
    fill(ctx, x + 5, y + 50, w - 10, 1, C.muted);
    text(ctx, '来访', x + 5, y + 3, 5, C.red);
  } else if (def.kind === 'action') {
    for (let i = 0; i < 3; i += 1) {
      fill(ctx, x + 5, y + 13 + i * 14, w - 10, 11, '#232833');
      fill(ctx, x + 8, y + 16 + i * 14, w - 22, 1, C.paper2);
      fill(ctx, x + 8, y + 20 + i * 14, w - 32, 1, C.muted);
    }
    text(ctx, '主桌 / 行动', x + 5, y + 3, 5, C.yellow2);
  } else if (def.kind === 'council') {
    text(ctx, '议事 / 第五席', x + 5, y + 3, 5, C.red);
    for (let i = 0; i < 5; i += 1) {
      const sx = x + 7 + i * 22;
      fill(ctx, sx, y + 16, 18, 22, i === 4 ? 'transparent' : i === 3 ? C.yellow : i < 2 ? C.green : C.blue);
      if (i === 4) {
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(sx, y + 16, 18, 22);
        ctx.setLineDash([]);
      }
      text(ctx, i === 4 ? '空' : String(i + 1), sx + 9, y + 24, 6, i === 4 ? C.muted : C.ink, 'center');
    }
    fill(ctx, x + 5, y + 43, w - 10, 1, C.muted);
    for (let i = 0; i < 3; i += 1) fill(ctx, x + 7, y + 48 + i * 6, w - 24 - i * 10, 1, ink);
    // 递归窗口
    const rec = smooth(phase(t, 10.65, 11.15));
    if (rec > 0) {
      ctx.save();
      ctx.globalAlpha = rec;
      fill(ctx, x + w - 52, y + 19, 40, 28, C.paper);
      fill(ctx, x + w - 50, y + 21, 36, 24, C.paper3);
      fill(ctx, x + w - 47, y + 24, 28, 2, C.red);
      fill(ctx, x + w - 47, y + 29, 20, 1, C.muted);
      fill(ctx, x + w - 47, y + 32, 24, 1, C.muted);
      ctx.restore();
    }
  } else if (def.kind === 'manual') {
    text(ctx, '共用手册', x + 5, y + 3, 5, C.red);
    for (let i = 0; i < 4; i += 1) {
      fill(ctx, x + 5, y + 13 + i * 10, w - 10, 8, i === 2 ? '#f3ead8' : 'rgba(232,224,204,0.55)');
      fill(ctx, x + 8, y + 16 + i * 10, 34 - i * 3, 1, C.ink2);
      fill(ctx, x + 50, y + 16 + i * 10, 14, 1, C.muted);
    }
  } else {
    text(ctx, '回执', x + 5, y + 3, 5, C.red);
    for (let i = 0; i < 5; i += 1) fill(ctx, x + 5, y + 13 + i * 6, w - 10 - (i % 3) * 7, 1, ink);
  }

  // 窗口按钮/页码
  fill(ctx, x + w - 4, y + 3, 1, 1, C.muted);
  if (def.kind !== 'action') {
    line(ctx, x + w - 9, y + 3, x + w - 5, y + 7, C.muted);
    line(ctx, x + w - 9, y + 7, x + w - 5, y + 3, C.muted);
  }
}

function drawWindows(ctx: CanvasRenderingContext2D, t: number) {
  if (t < 8.7) return;
  const collapse = phase(t, 12.9, 13.75);
  for (const def of WINDOWS) {
    const enter = easeOutBack(phase(t, def.delay, def.delay + 0.62));
    if (enter <= 0) continue;
    let dx = 0;
    let dy = 0;
    if (def.from === 'top') dy = -86;
    if (def.from === 'bottom') dy = 86;
    if (def.from === 'left') dx = -92;
    if (def.from === 'right') dx = 92;
    const wobble = Math.sin(t * 2.5 + def.delay * 4) * 1.2;
    const float = Math.sin(t * 1.9 + def.delay * 5.3) * 1.1;
    let x = def.x + (1 - enter) * dx + wobble;
    let y = def.y + (1 - enter) * dy + float;
    let scale = 0.86 + 0.18 * Math.min(1.1, enter);
    let alpha = clamp(enter * 1.5);
    let rot = def.rot + (1 - enter) * 0.08 + Math.sin(t * 1.35 + def.delay) * 0.006;
    if (collapse > 0) {
      x += (176 - x) * collapse;
      y += (92 - y) * collapse;
      scale *= 1 - 0.78 * collapse;
      alpha *= 1 - collapse;
      rot += collapse * 0.22;
    }
    if (alpha <= 0) continue;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + def.w / 2, y + def.h / 2);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    const dark = def.kind === 'action';
    fill(ctx, -def.w / 2 + 3, -def.h / 2 + 4, def.w, def.h, 'rgba(0,0,0,0.4)');
    fill(ctx, -def.w / 2, -def.h / 2, def.w, def.h, C.ink);
    fill(ctx, -def.w / 2 + 2, -def.h / 2 + 2, def.w - 4, def.h - 4, def.color);
    if (dark) {
      fill(ctx, -def.w / 2 + 3, -def.h / 2 + 3, def.w - 6, 10, '#232833');
      fill(ctx, -def.w / 2 + 3, -def.h / 2 + 13, def.w - 6, 1, '#3a3f42');
    } else {
      fill(ctx, -def.w / 2 + 3, -def.h / 2 + 3, def.w - 6, 10, C.paper);
      fill(ctx, -def.w / 2 + 3, -def.h / 2 + 13, def.w - 6, 1, C.muted);
      fill(ctx, -def.w / 2 + 3, -def.h / 2 + 3, 5, 1, C.red);
    }
    windowLines(ctx, def, -def.w / 2 + 4, -def.h / 2 + 4, def.w - 8, def.h - 8, t);
    ctx.restore();

    // 混沌残影
    if (t > 16.3 && t < 20.8) {
      withAlpha(ctx, 0.22 * (0.5 + 0.5 * Math.sin(t * 13 + def.delay)), () => {
        fill(ctx, x + 5, y + 3, def.w, 2, C.sky);
        fill(ctx, x - 4, y + def.h - 6, def.w, 1, C.red);
      });
    }
  }
}

function drawArchive(ctx: CanvasRenderingContext2D, t: number) {
  if (t < 13.25) return;
  const slam = easeOutBack(phase(t, 13.25, 13.82));
  const crack = phase(t, 15.1, 15.55);
  const burst = phase(t, 15.45, 16.95);
  const fade = 1 - smooth(phase(t, 15.7, 16.72));
  if (burst >= 1) return;
  const cx = 176;
  const cy = 95;
  const scale = (0.6 + 0.4 * slam) * (1 + burst * 0.04);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.rotate(-0.015 + Math.sin(t * 4.2) * 0.005);
  fill(ctx, -91, -63, 182, 126, 'rgba(0,0,0,0.55)');
  fill(ctx, -89, -61, 178, 122, C.ink);
  fill(ctx, -86, -58, 172, 116, C.paper3);
  fill(ctx, -82, -54, 164, 6, C.paper);
  text(ctx, '档案 08 / 归档', -78, -48, 7, C.red);
  // 假结局不出现标题，只留被涂掉的姓名栏；标题留到最后一拍。
  fill(ctx, -64, -30, 128, 2, C.ink2);
  fill(ctx, -48, -22, 96, 2, C.ink2);
  fill(ctx, -34, -14, 68, 1, C.muted);
  text(ctx, '姓名栏 / 已涂销', 0, 2, 6, C.muted, 'center');
  line(ctx, -68, 17, 68, 17, C.muted);
  for (let i = 0; i < 3; i += 1) fill(ctx, -58, 28 + i * 9, 116 - i * 18, 2, C.ink2);
  fill(ctx, -44, 58, 88, 1, C.muted);

  // 章
  const stampP = easeOutBack(phase(t, 13.9, 14.18));
  if (stampP > 0) {
    ctx.save();
    ctx.translate(45, 42);
    ctx.rotate(-0.12);
    const squash = 1 - 0.12 * Math.sin(clamp(phase(t, 14.0, 14.3)) * Math.PI);
    ctx.scale(stampP * (1 + (1 - squash) * 0.55), stampP * squash);
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    ctx.strokeRect(-31, -14, 62, 28);
    text(ctx, '归 档', 0, -8, 12, C.red, 'center');
    ctx.restore();
  }

  if (crack > 0) {
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, -58);
    ctx.lineTo(-5, -30);
    ctx.lineTo(-16, -3);
    ctx.lineTo(3, 22);
    ctx.lineTo(-8, 57);
    ctx.stroke();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(23, -58);
    ctx.lineTo(13, -24);
    ctx.lineTo(30, 6);
    ctx.lineTo(18, 33);
    ctx.lineTo(28, 57);
    ctx.stroke();
  }
  ctx.restore();

  if (burst > 0) {
    for (const shard of SHARDS) {
      const p = clamp((burst - shard.delay) / (1 - shard.delay));
      if (p <= 0) continue;
      const travel = easeOut(p, 2.1) * shard.speed;
      const x = cx + Math.cos(shard.angle) * travel;
      const y = cy + Math.sin(shard.angle) * travel;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(shard.angle + p * shard.spin);
      ctx.globalAlpha = 1 - p;
      fill(ctx, -shard.size / 2, -shard.size / 3, shard.size, shard.size / 1.5, shard.color);
      ctx.restore();
    }
  }
}

function drawStamps(ctx: CanvasRenderingContext2D, t: number) {
  if (t < 16.4 || t > 20.6) return;
  const stamps = [
    { x: 72, y: 52, rot: -0.12, delay: 16.55 },
    { x: 280, y: 76, rot: 0.1, delay: 17.1 },
    { x: 118, y: 144, rot: -0.06, delay: 18.1 },
    { x: 244, y: 142, rot: 0.08, delay: 19.15 },
  ];
  for (const item of stamps) {
    const p = easeOutBack(phase(t, item.delay, item.delay + 0.26));
    if (p <= 0) continue;
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rot);
    ctx.globalAlpha = 0.75 * smooth(phase(t, 16.4, 16.7)) * (1 - smooth(phase(t, 20.15, 20.7)));
    ctx.scale(p, p);
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    ctx.strokeRect(-28, -11, 56, 22);
    text(ctx, '归 档', 0, -6, 9, C.red, 'center');
    ctx.restore();
  }
}

function drawBands(ctx: CanvasRenderingContext2D, t: number) {
  const scratch = getScratch(ctx);
  const sctx = scratch.getContext('2d');
  if (!sctx) return;
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.clearRect(0, 0, W, H);
  sctx.imageSmoothingEnabled = false;
  const camera = cameraAt(t);
  sctx.save();
  sctx.translate(W / 2 + camera.x, H / 2 + camera.y);
  sctx.rotate(camera.rot);
  sctx.scale(camera.zoom, camera.zoom);
  sctx.translate(-W / 2, -H / 2);
  drawWorld(sctx, t, true);
  sctx.restore();

  fill(ctx, 0, 0, W, H, C.void);
  const morph = smooth(phase(t, 16.4, 17.0));
  const outro = 1 - smooth(phase(t, 20.15, 20.7));
  const tear = morph * outro;
  const count = 7;
  const bandH = H / count;
  for (let i = 0; i < count; i += 1) {
    const y = i * bandH;
    const speed = (i - count / 2) * 1.8;
    const shift = (Math.sin(t * 2.4 + i * 1.7) * (4 + i) + speed) * tear;
    const jitter = Math.sin(t * 19 + i * 4) * 1.2 * tear;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y, W, bandH + 0.5);
    ctx.clip();
    ctx.drawImage(scratch, 0, y, W, bandH, Math.round(shift), Math.round(y + jitter), W, bandH);
    ctx.restore();
    if (i % 2 === 0) fill(ctx, 0, y + bandH - 1, W, 1, `rgba(166,43,32,${0.65 * tear})`);
    else fill(ctx, 0, y, W, 1, `rgba(232,224,204,${0.22 * tear})`);
  }

  drawStamps(ctx, t);

  withAlpha(ctx, tear, () => {
    // 横向重影与碎片
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.16;
    ctx.drawImage(scratch, -2, Math.sin(t * 8) * 1.4);
    ctx.globalAlpha = 0.1;
    ctx.drawImage(scratch, 3, 0);
    ctx.restore();

    for (let i = 0; i < 9; i += 1) {
      const y = (i * 23 + t * 31) % H;
      const x = (i * 79 + Math.sin(t * 4 + i) * 48 + W) % W;
      const length = 18 + (i * 17) % 74;
      fill(ctx, x, y, length, i % 3 === 0 ? 2 : 1, i % 4 === 0 ? C.red : 'rgba(232,224,204,0.35)');
    }
    const scan = (t * 34) % H;
    fill(ctx, 0, scan, W, 2, 'rgba(232,224,204,0.09)');
    line(ctx, 0, H - 6, W, H - 6, C.red, 1);
    text(ctx, 'INDEX CORRUPTED', 8, 8, 5, C.red);
    text(ctx, '2026.01 / 2026.05.31 / 2026.02.02', W - 8, H - 12, 5, C.paper2, 'right');
  });
}

function drawVortex(ctx: CanvasRenderingContext2D, t: number) {
  if (t < 20.6 || t > 24.15) return;
  const p = smooth(phase(t, 20.6, 24.0));
  const intro = smooth(phase(t, 20.6, 21.05));
  ctx.save();
  ctx.translate(176, 111);
  for (const dot of VORTEX) {
    const radius = dot.radius * (1 - p * 0.88);
    const angle = dot.angle + p * dot.speed * 3.2 + Math.sin(t * 2 + dot.phase) * 0.08;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.72;
    ctx.globalAlpha = (1 - p) * 0.7 * intro;
    fill(ctx, x, y, dot.size, dot.size, dot.color);
  }
  ctx.restore();
  // 反向速度线
  ctx.globalAlpha = 0.35 * intro;
  for (let i = 0; i < 10; i += 1) {
    const a = i * 0.9 + t * 1.4;
    line(ctx, 176 + Math.cos(a) * 120, 100 + Math.sin(a) * 70, 176 + Math.cos(a) * 40, 100 + Math.sin(a) * 28, C.paper2);
  }
  ctx.globalAlpha = 1;
}

function drawFinal(ctx: CanvasRenderingContext2D, t: number) {
  if (t < 24.1) return;
  fill(ctx, 0, 0, W, H, C.void);
  const off = 1 - smooth(phase(t, 24.1, 24.5));
  if (off > 0) {
    fill(ctx, 174, 96, 4, 4, C.paper3);
    fill(ctx, (W - W * off) / 2, 97, W * off, 1, 'rgba(232,224,204,0.8)');
  }
  // CRT 余辉
  for (let y = 0; y < H; y += 3) {
    fill(ctx, 0, y, W, 1, 'rgba(232,224,204,0.025)');
  }
  const chairAlpha = 1 - smooth(phase(t, 25.9, 26.55));
  drawChair(ctx, 163, 121, C.muted, true, chairAlpha * 0.65);
  text(ctx, '第五席 / 空置', 176, 153, 5, C.muted, 'center');

  const stampP = easeOutBack(phase(t, 24.7, 25.0));
  if (stampP > 0) {
    const squash = 1 - 0.1 * Math.sin(clamp(phase(t, 24.7, 25.15)) * Math.PI);
    ctx.save();
    ctx.translate(246, 47);
    ctx.rotate(0.1);
    ctx.scale(stampP * (1 + (1 - squash) * 0.4), stampP * squash);
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    ctx.strokeRect(-26, -18, 52, 36);
    text(ctx, '归 档', 0, -8, 10, C.red, 'center');
    text(ctx, '08', 0, 5, 7, C.red, 'center');
    ctx.restore();
  }

  const title = '在漫长岁月之后';
  const start = 25.05;
  const chars = [...title];
  const baseX = 176 - (chars.length * 20) / 2;
  for (let i = 0; i < chars.length; i += 1) {
    const p = easeOutBack(phase(t, start + i * 0.07, start + 0.7 + i * 0.07));
    if (p <= 0) continue;
    const glitch = t < 26.1 ? Math.sin(t * 47 + i * 2.1) * 2.2 : 0;
    const y = 78 + (1 - p) * 18 + Math.sin(t * 2.4 + i) * 0.5;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.translate(baseX + i * 20 + glitch, y);
    ctx.scale(p, p);
    text(ctx, chars[i], 0, 0, 19, C.paper3, 'left');
    if (glitch !== 0) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.18;
      text(ctx, chars[i], -1.5, 0, 19, C.sky, 'left');
      text(ctx, chars[i], 1.5, 0, 19, C.red, 'left');
    }
    ctx.restore();
  }

  const sub = smooth(phase(t, 25.9, 26.4));
  withAlpha(ctx, sub * 0.9, () => {
    text(ctx, 'after a long long time', 176, 106, 7, C.sky, 'center');
    text(ctx, '八回合 · 一本手册 · 一个名字', 176, 119, 5, C.muted, 'center');
    line(ctx, 136, 130, 216, 130, C.muted);
  });

  const fade = 1 - smooth(phase(t, 26.6, 27));
  if (fade < 1) {
    ctx.globalAlpha = fade;
  }
  if (fade <= 0) {
    fill(ctx, 0, 0, W, H, C.void);
  }
}

function drawDust(ctx: CanvasRenderingContext2D, t: number) {
  for (const dot of DUST) {
    const y = (dot.y + t * dot.speed) % H;
    ctx.globalAlpha = dot.alpha * (0.55 + 0.45 * Math.sin(t * 2 + dot.x));
    fill(ctx, dot.x, y, dot.size, dot.size, C.paper2);
  }
  ctx.globalAlpha = 1;
}

function drawGlitch(ctx: CanvasRenderingContext2D, t: number) {
  if (t > 2.6 && t < 13) return;
  if (t > 16.4 && t < 20.8) return;
  if (t > 24.1) return;
  const active =
    (t > 0.45 && t < 1.9) ||
    (t > 3.15 && t < 3.55) ||
    (t > 7.2 && t < 7.55) ||
    (t > 13.98 && t < 14.35) ||
    (t > 15.25 && t < 15.75);
  if (!active) return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 4; i += 1) {
    const y = (t * 91 + i * 47) % H;
    fill(ctx, 0, y, W, 1 + i, i % 2 === 0 ? 'rgba(143,168,184,0.35)' : 'rgba(166,43,32,0.3)');
  }
  ctx.restore();
}

function drawWorld(ctx: CanvasRenderingContext2D, t: number, withChairs: boolean) {
  drawRoom(ctx);
  drawMonitor(ctx, t);
  drawDeskObjects(ctx, t);
  drawMap(ctx, t);
  if (withChairs) drawChairs(ctx, t);
  drawWindows(ctx, t);
  drawArchive(ctx, t);
  drawDust(ctx, t);
}

let scratch: HTMLCanvasElement | null = null;
function getScratch(ctx: CanvasRenderingContext2D) {
  if (!scratch) {
    scratch = ctx.canvas.ownerDocument.createElement('canvas');
    scratch.width = W;
    scratch.height = H;
  }
  return scratch;
}

export const AFTERSTORY_OPENING: CanvasOpening = {
  chapterId: 'afterstory',
  duration: AFTERSTORY_DURATION,
  sfx: AFTERSTORY_SFX,
  ariaLabel: '《在漫长岁月之后》开场动画',
  caption: '在漫长岁月之后 · AFTERSTORY',
  draw(ctx, time) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    fill(ctx, 0, 0, W, H, C.void);

    if (time >= 24.1) {
      drawFinal(ctx, time);
      drawCrtFlash(ctx, time);
      drawGlitch(ctx, time);
      return;
    }

    if (time >= 16.4 && time < 20.6) {
      drawBands(ctx, time);
      drawCrtFlash(ctx, time);
      drawVortex(ctx, time);
      return;
    }

    const camera = cameraAt(time);
    ctx.save();
    ctx.translate(W / 2 + camera.x, H / 2 + camera.y);
    ctx.rotate(camera.rot);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-W / 2, -H / 2);
    drawWorld(ctx, time, true);
    ctx.restore();

    drawBoot(ctx, time);
    drawCrtFlash(ctx, time);

    if (time >= 20.6) {
      drawVortex(ctx, time);
      // 独立的第五把椅子，逆着吸力留在画面里
      const hold = 1 - smooth(phase(time, 23.6, 24.2));
      drawChair(ctx, 163, 152, C.muted, true, hold * 0.7, 0);
      text(ctx, '第五席 / 空置', 176, 184, 5, C.muted, 'center');
    }

    drawGlitch(ctx, time);
  },
};
