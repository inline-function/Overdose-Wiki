export const CH04_DURATION = 9.8;

const W = 352;
const H = 198;
const CX = 176;
const CY = 101;
const FOLDER_W = 48;
const FOLDER_H = 64;

const C = {
  bg: '#0d0d14',
  ink: '#1a1a2e',
  deep: '#0b0a10',
  paper: '#e9e5d2',
  pale: '#f4f1e2',
  red: '#bf3b2b',
  redDark: '#6e1e1a',
  amber: '#e3b54a',
  folder: '#c99743',
  folderDark: '#8a612a',
  blood: '#4a2620',
  night: '#31506b',
  char: '#140f0c',
  smoke: '#34333a',
  white: '#ffffff',
  ember: '#e77b2d',
  flameRed: '#a52d1f',
  flameOrange: '#d95a25',
  flameYellow: '#f0a93c',
  flamePale: '#ffe6a3',
};

const T = {
  dropStart: 0.18,
  dropEnd: 3.0,
  holdEnd: 3.55,
  fireStart: 3.7,
  burnEnd: 6.95,
  titleStart: 7.55,
  titleEnd: 9.2,
  fadeStart: 9.35,
  fadeEnd: 9.8,
};

export type Ch04Sfx = 'paper' | 'fire' | 'crack' | 'hiss' | 'stamp' | 'burst';

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function phase(time: number, from: number, to: number) {
  return clamp((time - from) / (to - from));
}

function stepped(value: number, steps = 4) {
  return Math.floor(clamp(value) * steps) / steps;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), size, size);
}

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

// 整数哈希：让火的每一帧都有颗粒感，但不使用平滑噪声。
function hash(x: number, y: number, frame: number) {
  let n = Math.imul(x + 17, 374761393) + Math.imul(y + 31, 668265263) + Math.imul(frame + 7, 1442695041);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

const random = seeded(0x4401);

type Folder = {
  x: number;
  y: number;
  angle: number;
  arrival: number;
  blood: Array<{ x: number; y: number; w: number; h: number }>;
  tone: number;
};

const FOLDER_FILLS = ['#c99a5b', '#bd8b4c', '#d2a566', '#b07a3f'];

// 一条条横排压紧，边缘再收成椭圆，避免中间露出空隙。
const FOLDER_ROWS = [
  [-66, -22, 22, 66],
  [-96, -48, 0, 48, 96],
  [-108, -65, -22, 22, 65, 108],
  [-96, -48, 0, 48, 96],
  [-66, -22, 22, 66],
];

const folderX = (index: number) => {
  let cursor = 0;
  for (let row = 0; row < FOLDER_ROWS.length; row += 1) {
    const columns = FOLDER_ROWS[row];
    if (index < cursor + columns.length) {
      return CX + columns[index - cursor] + (random() - 0.5) * 8;
    }
    cursor += columns.length;
  }
  return CX;
};

const folderY = (index: number) => {
  let cursor = 0;
  for (let row = 0; row < FOLDER_ROWS.length; row += 1) {
    const columns = FOLDER_ROWS[row];
    if (index < cursor + columns.length) {
      return CY - 46 + row * 23 + (random() - 0.5) * 6;
    }
    cursor += columns.length;
  }
  return CY;
};

function folderAngle() {
  return (random() - 0.5) * 44;
}


const FOLDERS: Folder[] = Array.from({ length: 24 }, (_, index) => {
  return {
    // 集中在画面中下部，像被随手丢成一摞，而不是散在整张桌子上。
    x: folderX(index),
    y: folderY(index),
    angle: folderAngle(),
    arrival: T.dropStart + index * 0.06 + random() * 0.02,
    blood: Array.from({ length: 2 + Math.floor(random() * 3) }, () => ({
      x: random() * 36 - 18,
      y: random() * 46 - 23,
      w: 1 + Math.floor(random() * 3),
      h: 1 + Math.floor(random() * 2),
    })),
    tone: Math.floor(random() * FOLDER_FILLS.length),
  };
});

function pixelLine(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);
  const dx = Math.abs(tx - x);
  const sx = x < tx ? 1 : -1;
  const dy = -Math.abs(ty - y);
  const sy = y < ty ? 1 : -1;
  let error = dx + dy;
  ctx.fillStyle = color;
  for (;;) {
    ctx.fillRect(x, y, 1, 1);
    if (x === tx && y === ty) break;
    const e2 = 2 * error;
    if (e2 >= dy) {
      error += dy;
      x += sx;
    }
    if (e2 <= dx) {
      error += dx;
      y += sy;
    }
  }
}

function drawDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  fill: string,
) {
  const x = Math.round(cx - width / 2);
  const y = Math.round(cy - height / 2);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 1, y, width - 2, height);
  ctx.fillRect(x, y + 1, width, height - 2);
}

function drawFolder(ctx: CanvasRenderingContext2D, folder: Folder, time: number) {
  const p = clamp((time - folder.arrival) / 0.32);
  if (p <= 0) return;
  const drop = stepped(p, 4);
  const y = Math.round(folder.y - (1 - drop) * 34);
  const x = Math.round(folder.x);
  const halfW = FOLDER_W / 2;
  const halfH = FOLDER_H / 2;
  const top = -halfH;
  const bodyTop = top + halfH * 0.16;
  const flapInset = halfW * 0.24;
  const flapTop = top - halfH * 0.14;
  const buttonW = Math.max(8, Math.round(halfW * 0.34));
  const buttonH = Math.max(6, Math.round(halfH * 0.13));
  const buttonTopY = top + halfH * 0.12;
  const buttonBottomY = top + halfH * 0.43;
  const bodyH = FOLDER_H - (bodyTop - top);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((folder.angle * Math.PI) / 180);

  // 淡一点的投影，只留一层，不糊成一团黑。
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = C.deep;
  ctx.fillRect(-halfW + 3, top + 5, FOLDER_W, FOLDER_H);
  ctx.restore();
  // 细轮廓。
  ctx.fillStyle = C.ink;
  ctx.fillRect(-halfW - 1, bodyTop - 1, FOLDER_W + 2, bodyH + 2);
  // 牛皮纸袋身。
  ctx.fillStyle = FOLDER_FILLS[folder.tone];
  ctx.fillRect(-halfW, bodyTop, FOLDER_W, bodyH);
  // 折盖：上宽下窄的牛皮纸袋盖。
  ctx.beginPath();
  ctx.moveTo(-halfW - 1, bodyTop);
  ctx.lineTo(-halfW + flapInset, flapTop);
  ctx.lineTo(halfW - flapInset, flapTop);
  ctx.lineTo(halfW + 1, bodyTop);
  ctx.closePath();
  ctx.fillStyle = FOLDER_FILLS[folder.tone];
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  // 折盖内侧的暗边与折痕。
  ctx.fillStyle = C.folderDark;
  ctx.fillRect(-halfW + flapInset, flapTop + 3, FOLDER_W - flapInset * 2, 2);
  ctx.fillRect(-halfW, bodyTop, 2, bodyH);
  ctx.fillRect(halfW - 1, bodyTop, 1, bodyH);
  ctx.fillStyle = 'rgba(94, 60, 28, 0.22)';
  for (let i = 1; i <= 4; i += 1) {
    ctx.fillRect(-halfW + 3, bodyTop + (FOLDER_H * 0.16 * i), FOLDER_W - 6, 1);
  }
  // 暗陈血渍。
  folder.blood.forEach((mark) => {
    px(ctx, mark.x, mark.y, C.blood, mark.w);
    if (mark.w > 1) px(ctx, mark.x + 1, mark.y + mark.h, C.blood, 1 + (mark.w > 3 ? 1 : 0));
  });
  // 圆片与红线：档案袋正面的固定扣。
  drawDisc(ctx, 0, buttonTopY, buttonW, buttonH, '#d9c49a');
  drawDisc(ctx, 0, buttonTopY, Math.max(7, buttonW - 6), Math.max(6, buttonH - 4), C.folderDark);
  drawDisc(ctx, 0, buttonTopY, Math.max(4, buttonW - 10), Math.max(4, buttonH - 6), '#e8d6ae');
  drawDisc(ctx, 0, buttonBottomY, buttonW, buttonH, '#d9c49a');
  drawDisc(ctx, 0, buttonBottomY, Math.max(7, buttonW - 6), Math.max(6, buttonH - 4), C.folderDark);
  drawDisc(ctx, 0, buttonBottomY, Math.max(4, buttonW - 10), Math.max(4, buttonH - 6), '#e8d6ae');
  // 缠绕线，仍用整数像素画。
  const stringColor = '#8e3d2b';
  const leftAnchor = -halfW + 11;
  const rightAnchor = halfW - 11;
  pixelLine(ctx, leftAnchor, buttonTopY - 5, -buttonW / 2, buttonTopY, stringColor);
  pixelLine(ctx, rightAnchor, buttonTopY - 5, buttonW / 2, buttonTopY, stringColor);
  pixelLine(ctx, -buttonW / 2, buttonTopY + 2, -buttonW / 2 - 5, buttonBottomY - 2, stringColor);
  pixelLine(ctx, buttonW / 2, buttonTopY + 2, buttonW / 2 + 5, buttonBottomY - 2, stringColor);
  pixelLine(ctx, -buttonW / 2 - 5, buttonBottomY - 2, 0, buttonBottomY + buttonH, stringColor);
  pixelLine(ctx, buttonW / 2 + 5, buttonBottomY - 2, 0, buttonBottomY + buttonH, stringColor);
  pixelLine(ctx, 0, buttonBottomY + buttonH, 0, buttonBottomY + buttonH + 8, stringColor);
  ctx.restore();
}

function drawPile(ctx: CanvasRenderingContext2D, time: number) {
  FOLDERS.forEach((folder) => drawFolder(ctx, folder, time));
}


function flameLayer(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  width: number,
  height: number,
  colors: [string, string, string, string],
  frame: number,
  seed: number,
) {
  const half = width / 2;
  for (let col = -half; col <= half; col += 2) {
    const u = col / half;
    const envelope = Math.pow(Math.max(0, 1 - u * u), 0.55);
    const flicker = 0.72 + hash(col, seed, frame) * 0.28;
    const tongue = 0.82 + 0.18 * Math.sin(col * 0.45 + frame * 0.9 + seed);
    const columnHeight = height * envelope * flicker * tongue;
    if (columnHeight < 2) continue;
    const top = baseY - columnHeight;
    for (let y = baseY; y >= top; y -= 2) {
      const v = (baseY - y) / Math.max(1, columnHeight);
      if (hash(col, y, frame + seed) < 0.05 + v * 0.2) continue;
      const wiggle = Math.round((hash(col, y, frame + 9) - 0.5) * 3 * v);
      const narrow = Math.abs(col) / half;
      let color = colors[0];
      if (v > 0.72 || (narrow < 0.24 && v > 0.52)) color = colors[3];
      else if (v > 0.45 || (narrow < 0.4 && v > 0.32)) color = colors[2];
      else if (v > 0.2) color = colors[1];
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(baseX + col + wiggle), Math.round(y), 2, 2);
    }
  }
}

function holePoint(burn: number, angle: number) {
  const halfW = 12 + burn * 94;
  const halfH = 10 + burn * 50;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const x = CX + halfW * Math.sign(cosine) * Math.pow(Math.abs(cosine), 0.52);
  const y = CY + halfH * Math.sign(sine) * Math.pow(Math.abs(sine), 0.52);
  return { x, y };
}

function holePath(ctx: CanvasRenderingContext2D, burn: number) {
  const points = 40;
  ctx.beginPath();
  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    const point = holePoint(burn, angle);
    const jag = (hash(i, 3, Math.floor(burn * 20)) - 0.5) * 3;
    const x = point.x + Math.cos(angle) * jag;
    const y = point.y + Math.sin(angle) * jag;
    if (i === 0) ctx.moveTo(Math.round(x), Math.round(y));
    else ctx.lineTo(Math.round(x), Math.round(y));
  }
  ctx.closePath();
}

function drawTitleCard(ctx: CanvasRenderingContext2D, time: number) {
  const alpha = clamp((time - T.titleStart) / 0.55);
  if (alpha <= 0) return;
  const titleY = 69;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text = (value: string, y: number, color: string, font: string) => {
    ctx.font = font;
    ctx.fillStyle = 'rgba(8, 7, 8, 0.7)';
    ctx.fillText(value, CX + 2, y + 2);
    ctx.fillStyle = color;
    ctx.fillText(value, CX, y);
  };

  // 标题直接烧在洞里的黑暗上，不再垫白纸卡。
  text('人们将往何处去', titleY + 30, C.paper, '20px "Fusion Pixel 12 Patch", "Fusion Pixel 12", monospace');
  text('WHERE DO WE GO?', titleY + 50, '#b8aa91', '9px "Fusion Pixel 10 Patch", "Fusion Pixel 10", monospace');
  ctx.restore();
}

function drawFireRing(ctx: CanvasRenderingContext2D, time: number, burn: number) {
  const frame = Math.floor(time * 10);
  // 火不再只从纸堆中心冒，而是沿着烧穿的洞缘一簇一簇地舔出来。
  for (let i = 0; i < 22; i += 1) {
    const angle = (i / 22) * Math.PI * 2 + 0.08;
    const anchor = holePoint(burn, angle);
    const x = anchor.x + Math.cos(angle) * 2;
    const y = anchor.y + Math.sin(angle) * 2;
    const width = 14 + hash(i, 4, frame) * 12;
    const height = 14 + hash(i, 6, frame) * 24 + burn * 14;
    flameLayer(
      ctx,
      x,
      y,
      width,
      height,
      [C.flameRed, '#8f2a1b', C.flameOrange, C.flamePale],
      frame,
      30 + i,
    );
  }
  // 洞底的火舌与炭床，稍微压过焦黑的洞壁。
  const lower = holePoint(burn, Math.PI / 2);
  for (let i = 0; i < 9; i += 1) {
    const x = CX - 40 + i * 10;
    const height = 5 + hash(i, 8, frame) * 13;
    ctx.fillStyle = i % 3 === 0 ? C.flamePale : i % 2 === 0 ? C.ember : C.flameOrange;
    ctx.fillRect(Math.round(x), Math.round(lower.y - height), 4, Math.ceil(height));
  }
}

function drawBurn(ctx: CanvasRenderingContext2D, time: number) {
  const burn = stepped(phase(time, T.fireStart + 0.15, T.burnEnd), 4);
  if (burn <= 0) return;
  ctx.save();
  holePath(ctx, burn);
  ctx.clip();
  ctx.fillStyle = C.char;
  ctx.fillRect(0, 0, W, H);
  // 焦黑内壁的颗粒。
  for (let i = 0; i < 38; i += 1) {
    const a = (i * 2.4 + burn * 9) % (Math.PI * 2);
    const point = holePoint(burn, a);
    const scale = 0.55 + (i % 7) * 0.07;
    px(ctx, CX + (point.x - CX) * scale, CY + (point.y - CY) * scale, i % 3 === 0 ? C.ink : C.char, 2);
  }
  ctx.restore();

  drawFireRing(ctx, time, burn);
  drawTitleCard(ctx, time);

  // 焦黑丑边，分两层，避免圆滑。
  holePath(ctx, burn);
  ctx.strokeStyle = C.char;
  ctx.lineWidth = 9;
  ctx.stroke();
  holePath(ctx, burn);
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 3;
  ctx.stroke();
  // 外缘的焦痕与还亮着的纸边火星。
  for (let i = 0; i < 32; i += 1) {
    const a = (i * 2.7 + burn * 5) % (Math.PI * 2);
    const point = holePoint(burn, a);
    const hot = i % 4 === 0 && burn < 0.95;
    px(ctx, point.x, point.y, hot ? C.ember : i % 2 === 0 ? C.blood : C.char, 2);
  }
}

function drawScanlines(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = C.deep;
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  ctx.restore();
}

const CRACKLE_TIMES = Array.from({ length: 8 }, (_, i) => T.fireStart + 0.15 + i * 0.36);

const CH04_EVENTS: Array<{ t: number; key: Ch04Sfx }> = [
  ...FOLDERS.filter((_, index) => index % 2 === 0).map((folder) => ({
    t: folder.arrival,
    key: 'paper' as Ch04Sfx,
  })),
  { t: T.fireStart, key: 'fire' },
  ...CRACKLE_TIMES.map((t) => ({ t, key: 'crack' as Ch04Sfx })),
  { t: T.fireStart + 0.9, key: 'hiss' },
  { t: T.burnEnd, key: 'burst' },
  { t: T.titleStart, key: 'stamp' },
];

CH04_EVENTS.sort((a, b) => a.t - b.t);

export const CH04_SFX = CH04_EVENTS;

export function drawCh04(ctx: CanvasRenderingContext2D, time: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = false;

  // 夜墙底：接近黑，只有少量蓝灰结构。
  ctx.fillStyle = '#10101b';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 12; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#141422' : '#171827';
    ctx.fillRect(0, i * 17, W, 1);
  }
  for (let x = 0; x < W; x += 48) {
    ctx.fillStyle = '#151625';
    ctx.fillRect(x, 0, 1, H);
  }

  drawPile(ctx, time);

  if (time >= T.fireStart + 0.15) drawBurn(ctx, time);

  drawScanlines(ctx);

  const fade = phase(time, T.fadeStart, T.fadeEnd);
  if (fade > 0) {
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
