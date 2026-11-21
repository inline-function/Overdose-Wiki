export const CH03_DURATION = 12;

const W = 352;
const H = 198;
const CX = 176;
const CY = 98;
const GROUND = 170;
const NIGHT = '#141424';
const FRAME = { x: 14, y: 14, w: W - 28, h: H - 28 };

const C = {
  bg: '#0d0d14',
  ink: '#1a1a2e',
  deep: '#0b0b12',
  paper: '#e9e5d2',
  pale: '#f4f1e2',
  red: '#bf3b2b',
  redDark: '#6e1e1a',
  amber: '#e3b54a',
  night: '#31506b',
  cool: '#8fa8b8',
  white: '#ffffff',
  gray: '#41414a',
  nightBg: NIGHT,
};

const T = {
  loadStart: 0.15,
  holdStart: 1.8,
  holdEnd: 2.8,
  jumpStart: 2.8,
  jumpEnd: 3.1,
  hold90End: 3.4,
  done: 3.55,
  flipStart: 3.6,
  flipEnd: 4.15,
  barsStart: 4.2,
  shatter: 6.82,
  shatterEnd: 7.12,
  flipTitleStart: 7.12,
  flipTitleEnd: 7.72,
  titleStart: 7.72,
  bgFadeStart: 9.25,
  bgFadeEnd: 10.4,
  textFadeStart: 10.45,
  textFadeEnd: 11.65,
  end: 12,
};

const BAR_TIMES = [4.42, 4.92, 5.38, 5.8, 6.18, 6.54];
const BPMS = [60, 72, 84, 96, 110, 128, 150];

export type Ch03Sfx =
  | 'hiss'
  | 'focus'
  | 'tick'
  | 'cut'
  | 'heartbeat'
  | 'shatter'
  | 'stamp';

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function phase(time: number, from: number, to: number) {
  return clamp((time - from) / (to - from));
}

function mix(a: string, b: string, t: number) {
  const value = clamp(t);
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - value) + ((pb >> 16) & 255) * value);
  const g = Math.round(((pa >> 8) & 255) * (1 - value) + ((pb >> 8) & 255) * value);
  const bl = Math.round((pa & 255) * (1 - value) + (pb & 255) * value);
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
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

const random = seeded(0x3301);

const BUILDINGS = (() => {
  const list: Array<{ x: number; w: number; h: number; tone: number; windows: number[] }> = [];
  let x = -8;
  while (x < W + 10) {
    const w = 10 + Math.floor(random() * 18);
    const h = 28 + Math.floor(random() * 74);
    const windows: number[] = [];
    for (let i = 0; i < 36; i += 1) windows.push(random() < 0.45 ? 1 : 0);
    list.push({ x, w, h, tone: 0.25 + random() * 0.45, windows });
    x += w + 1 + Math.floor(random() * 3);
  }
  return list;
})();

const CROWD = Array.from({ length: 16 }, (_, index) => ({
  x: 18 + random() * (W - 36),
  y: GROUND + 5 + random() * 18,
  h: 4 + Math.floor(random() * 4),
  phase: random() * Math.PI * 2,
  tone: index % 4 === 0 ? C.night : C.deep,
}));

const BEATS = (() => {
  const list: number[] = [];
  let time = T.barsStart;
  let bpm = 60;
  let bar = 0;
  while (time < T.shatter) {
    list.push(time);
    const period = 60 / bpm;
    const nextBar = BAR_TIMES[bar];
    if (nextBar !== undefined && time + period > nextBar) {
      time = nextBar;
      bpm = BPMS[bar + 1];
      bar += 1;
    } else {
      time += period;
    }
  }
  return list;
})();

function loadValue(time: number) {
  if (time < T.loadStart) return 0;
  if (time < T.holdStart) return 0.5 * phase(time, T.loadStart, T.holdStart);
  if (time < T.holdEnd) return 0.5;
  if (time < T.jumpEnd) return 0.5 + 0.4 * phase(time, T.jumpStart, T.jumpEnd);
  if (time < T.hold90End) return 0.9;
  if (time < T.done) return 0.9 + 0.1 * phase(time, T.hold90End, T.done);
  return 1;
}

// 繁华城市夜：generic 楼群、窗灯、街道与人潮；不出现监控。
function drawCity(ctx: CanvasRenderingContext2D, time: number, bands: number, cold: number) {
  const step = Math.round(time * 10);
  ctx.fillStyle = C.deep;
  ctx.fillRect(0, 0, W, GROUND);
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, W, 39);
  ctx.fillStyle = '#191a2c';
  ctx.fillRect(0, 40, W, 42);
  ctx.fillStyle = '#10131d';
  ctx.fillRect(0, 82, W, GROUND - 82);

  for (let i = 0; i < 26; i += 1) {
    const x = (i * 53 + 17) % W;
    const y = (i * 29 + 11) % 92;
    px(ctx, x, y, i % 3 === 0 ? C.cool : C.amber, 1);
  }

  BUILDINGS.forEach((building) => {
    const top = GROUND - building.h;
    const body = mix(C.ink, C.night, building.tone);
    ctx.fillStyle = body;
    ctx.fillRect(Math.round(building.x), top, building.w, building.h);
    ctx.fillStyle = mix(body, C.ink, 0.45);
    ctx.fillRect(Math.round(building.x), top, 2, building.h);
    ctx.fillStyle = mix(body, C.pale, 0.2);
    ctx.fillRect(Math.round(building.x), top, building.w, 1);
    if (building.w > 18) {
      ctx.fillStyle = mix(body, C.ink, 0.25);
      ctx.fillRect(Math.round(building.x + 3), top + 4, building.w - 6, 2);
    }
    const cols = Math.max(1, Math.floor((building.w - 5) / 4));
    for (let row = 0; row < Math.floor((building.h - 8) / 5); row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = (row * cols + col) % building.windows.length;
        const lit = building.windows[index] === 1;
        const wx = building.x + 3 + col * 4;
        const wy = top + 7 + row * 5;
        if (lit) {
          px(ctx, wx, wy, C.amber, 2);
          px(ctx, wx + 1, wy + 1, mix(C.amber, C.white, 0.3), 1);
        } else {
          px(ctx, wx, wy, mix(body, C.deep, 0.35), 2);
        }
      }
    }
  });

  ctx.fillStyle = C.deep;
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = C.night;
  ctx.fillRect(0, GROUND, W, 1);
  ctx.fillStyle = '#262636';
  for (let x = 8; x < W; x += 24) ctx.fillRect(x, GROUND + 8, 10, 1);
  ctx.fillStyle = '#1d1d2b';
  for (let x = 2; x < W; x += 44) ctx.fillRect(x, GROUND + 21, 18, 1);

  for (let i = 0; i < 4; i += 1) {
    const x = (i * 83 + step * 5 + 13) % (W + 28) - 14;
    const y = GROUND + (i % 2 === 0 ? 4 : 15);
    ctx.fillStyle = '#242435';
    ctx.fillRect(Math.round(x), y, 16, 4);
    px(ctx, x + 1, y + 4, C.amber, 1);
    px(ctx, x + 13, y + 4, C.red, 1);
  }
  CROWD.forEach((person) => {
    const bob = Math.round(Math.sin(time * 2 + person.phase));
    ctx.fillStyle = person.tone;
    ctx.fillRect(Math.round(person.x), Math.round(person.y + bob), 2, person.h);
    px(ctx, person.x, person.y + bob - 2, mix(C.ink, C.cool, 0.2), 2);
    px(ctx, person.x + (person.phase > 2 ? 2 : -1), person.y + person.h - 1 + bob, C.ink, 1);
  });

  // 未加载的条带：逐 10% 露出。
  for (let band = bands; band < 10; band += 1) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, Math.floor((band * H) / 10), W, Math.ceil(H / 10) + 1);
  }

  if (cold > 0) {
    ctx.save();
    ctx.globalAlpha = 0.42 * cold;
    ctx.fillStyle = C.night;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.28 * cold;
    for (let y = 0; y < H; y += 3) {
      for (let x = (y % 6 === 0 ? 0 : 2); x < W; x += 5) {
        if ((x * 3 + y * 7) % 11 < 3) px(ctx, x, y, C.deep, 2);
      }
    }
    for (let i = 0; i < 7; i += 1) {
      const fx = (i * 61 + 27) % (W - 42);
      const fy = (i * 37 + 19) % (H - 28);
      ctx.fillStyle = i % 2 === 0 ? C.bg : C.night;
      ctx.fillRect(fx, fy, 18 + (i % 3) * 8, 2 + (i % 2) * 2);
      ctx.fillRect(fx + 3, fy + 4, 7, 1);
    }
    ctx.restore();
  }
}

function drawFrame(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(FRAME.x - 1, FRAME.y - 1, FRAME.w + 2, FRAME.h + 2);
}

function drawProgress(ctx: CanvasRenderingContext2D, value: number) {
  const x = 44;
  const y = 168;
  const w = 264;
  const h = 10;
  ctx.fillStyle = C.ink;
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = C.paper;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.night;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  const fill = Math.round((w - 4) * clamp(value));
  ctx.fillStyle = C.amber;
  ctx.fillRect(x + 2, y + 2, fill, h - 4);
  if (fill > 2) {
    ctx.fillStyle = C.pale;
    ctx.fillRect(x + 2 + fill - 2, y + 2, 2, h - 4);
  }
  ctx.fillStyle = C.deep;
  for (let i = 1; i < 10; i += 1) {
    ctx.fillRect(x + Math.round((w * i) / 10), y, 1, h);
  }
}

const HEART = [
  '..###...###..',
  '.#####.#####.',
  '#############',
  '#############',
  '#############',
  '.###########.',
  '..#########..',
  '...#######...',
  '....#####....',
  '.....###.....',
  '......#......',
];

// 每行的裂口位置不同，保证两半互补，而不是两个完整的心。
const SPLIT = [6, 6, 5, 7, 6, 7, 6, 6, 5, 6, 6];

function drawHeartCells(
  ctx: CanvasRenderingContext2D,
  side: 'left' | 'right',
  offset: number,
  scaleY: number,
) {
  const cell = 4;
  const shift = side === 'left' ? -offset : offset;
  ctx.save();
  ctx.translate(CX + shift, CY);
  ctx.scale(1, scaleY);
  ctx.translate(-CX, -CY);

  const left = CX - (HEART[0].length * cell) / 2;
  const top = CY - (HEART.length * cell) / 2;
  const splitFor = (row: number) => SPLIT[Math.min(row, SPLIT.length - 1)];

  // 先画硬投影。
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = C.deep;
  for (let row = 0; row < HEART.length; row += 1) {
    const split = splitFor(row);
    for (let col = 0; col < HEART[row].length; col += 1) {
      if (HEART[row][col] !== '#') continue;
      if (side === 'left' ? col >= split : col < split) continue;
      ctx.fillRect(Math.round(left + col * cell) + 3, Math.round(top + row * cell) + 3, cell, cell);
    }
  }

  ctx.globalAlpha = 1;
  for (let row = 0; row < HEART.length; row += 1) {
    const split = splitFor(row);
    for (let col = 0; col < HEART[row].length; col += 1) {
      if (HEART[row][col] !== '#') continue;
      if (side === 'left' ? col >= split : col < split) continue;
      const x = Math.round(left + col * cell);
      const y = Math.round(top + row * cell);
      const outer =
        col === 0 ||
        row === 0 ||
        col === HEART[row].length - 1 ||
        row === HEART.length - 1;
      const torn = side === 'left' ? col === split - 1 : col === split;
      ctx.fillStyle = outer || torn ? C.ink : C.red;
      ctx.fillRect(x, y, cell, cell);
      if (!outer && !torn && row < 3 && col < 5) {
        ctx.fillStyle = C.pale;
        ctx.fillRect(x, y, cell, cell);
      }
      if (!outer && !torn && row > 6 && col > 7) {
        ctx.fillStyle = C.redDark;
        ctx.fillRect(x, y, cell, cell);
      }
    }
  }
  ctx.restore();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, cell: number, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let row = 0; row < HEART.length; row += 1) {
    for (let col = 0; col < HEART[row].length; col += 1) {
      if (HEART[row][col] !== '#') continue;
      const x = Math.round(cx - (HEART[row].length * cell) / 2 + col * cell);
      const y = Math.round(cy - (HEART.length * cell) / 2 + row * cell);
      const edge = col === 0 || row === 0 || col === HEART[row].length - 1 || row === HEART.length - 1;
      ctx.fillStyle = edge ? C.ink : C.red;
      ctx.fillRect(x, y, cell, cell);
      if (!edge && row < 3 && col < 5) {
        ctx.fillStyle = C.pale;
        ctx.fillRect(x, y, cell, cell);
      }
      if (!edge && row > 6 && col > 7) {
        ctx.fillStyle = C.redDark;
        ctx.fillRect(x, y, cell, cell);
      }
    }
  }
  ctx.globalAlpha = 0.34 * alpha;
  ctx.fillStyle = C.deep;
  for (let row = 0; row < HEART.length; row += 1) {
    for (let col = 0; col < HEART[row].length; col += 1) {
      if (HEART[row][col] !== '#') continue;
      const x = Math.round(cx - (HEART[row].length * cell) / 2 + col * cell) + 3;
      const y = Math.round(cy - (HEART.length * cell) / 2 + row * cell) + 3;
      ctx.fillRect(x, y, cell, cell);
    }
  }
  ctx.restore();
}

function drawBars(ctx: CanvasRenderingContext2D, time: number) {
  for (let index = 0; index < BAR_TIMES.length; index += 1) {
    if (time >= BAR_TIMES[index]) continue;
    const y = CY - 31 + index * 12;
    const width = 72 - (index % 2) * 8;
    const left = Math.round(CX - width / 2);
    ctx.fillStyle = C.ink;
    ctx.fillRect(left, y, width, 7);
    ctx.fillStyle = C.deep;
    ctx.fillRect(left, y + 5, width, 2);
    ctx.fillStyle = C.night;
    ctx.fillRect(left + 2, y + 1, 3, 1);
  }
}

function drawHeartScene(ctx: CanvasRenderingContext2D, time: number) {
  const beats = BEATS.filter((beat) => beat <= time);
  const last = beats.length > 0 ? beats[beats.length - 1] : T.barsStart;
  const age = time - last;
  const pulse = age >= 0 && age < 0.12 ? 1.06 : 1;
  ctx.save();
  ctx.translate(CX, CY);
  ctx.scale(pulse, pulse);
  ctx.translate(-CX, -CY);
  drawHeart(ctx, CX, CY, 4, 1);
  ctx.restore();
  drawBars(ctx, time);
}

function drawFlip(ctx: CanvasRenderingContext2D, time: number) {
  const p = phase(time, T.flipStart, T.flipEnd);
  const sx = p < 0.18 ? 1 : p < 0.36 ? 0.55 : p < 0.5 ? 0.08 : p < 0.68 ? 0.08 : p < 0.84 ? 0.55 : 1;
  ctx.save();
  ctx.beginPath();
  ctx.rect(FRAME.x, FRAME.y, FRAME.w, FRAME.h);
  ctx.clip();
  ctx.translate(CX, CY);
  ctx.scale(sx, 1);
  ctx.translate(-CX, -CY);
  if (p < 0.5) {
    drawCity(ctx, time, 10, 0);
  } else {
    drawHeart(ctx, CX, CY, 4, 1);
  }
  ctx.restore();
  drawFrame(ctx);
  if (sx < 0.2) {
    ctx.fillStyle = C.ink;
    ctx.fillRect(CX - 2, FRAME.y + 8, 4, FRAME.h - 16);
    ctx.fillStyle = C.paper;
    ctx.fillRect(CX - 1, FRAME.y + 10, 1, FRAME.h - 20);
  }
}

function drawShatter(ctx: CanvasRenderingContext2D, time: number, scaleY = 1) {
  const age = Math.max(0, time - T.shatter);
  const offset = Math.round(Math.min(14, age * 70));
  drawHeartCells(ctx, 'left', offset, scaleY);
  drawHeartCells(ctx, 'right', offset, scaleY);
  if (scaleY > 0.2) {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(1, scaleY);
    ctx.translate(-CX, -CY);
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CX + 1, CY - 28);
    ctx.lineTo(CX - 4, CY - 8);
    ctx.lineTo(CX + 5, CY + 11);
    ctx.lineTo(CX - 1, CY + 26);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPaperPage(ctx: CanvasRenderingContext2D, scaleY: number, alpha: number, textAlpha: number) {
  if (alpha <= 0) return;
  const height = H * clamp(scaleY);
  const y = (H - height) / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, Math.round(y), W, Math.round(height));
  ctx.restore();
  if (scaleY > 0.92) {
    drawTitleText(ctx, textAlpha, 1);
  }
}

function drawTitleText(ctx: CanvasRenderingContext2D, alpha: number, paperAlpha: number) {
  if (alpha <= 0) return;
  const color = mix(C.ink, C.paper, clamp(1 - paperAlpha * 1.25));
  const secondary = mix(C.gray, C.cool, clamp(1 - paperAlpha * 1.25));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.font = '24px "Fusion Pixel 12 Patch", "Fusion Pixel 12", monospace';
  ctx.fillText('从此再也不见', CX, CY - 6);
  ctx.fillStyle = secondary;
  ctx.font = '10px "Fusion Pixel 10 Patch", "Fusion Pixel 10", monospace';
  ctx.fillText('NEVER SEEN AGAIN', CX, CY + 28);
  ctx.restore();
}

function drawTitleFlip(ctx: CanvasRenderingContext2D, time: number) {
  const p = phase(time, T.flipTitleStart, T.flipTitleEnd);
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, W, H);
  if (p < 0.5) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(FRAME.x, FRAME.y, FRAME.w, FRAME.h);
    ctx.clip();
    drawShatter(ctx, T.shatterEnd, 1 - p * 2);
    ctx.restore();
    drawFrame(ctx);
  } else {
    const scaleY = (p - 0.5) * 2;
    drawPaperPage(ctx, scaleY, 1, clamp((scaleY - 0.9) / 0.1));
  }
}

function drawTitlePage(ctx: CanvasRenderingContext2D, time: number) {
  const paperAlpha = 1 - phase(time, T.bgFadeStart, T.bgFadeEnd);
  const textAlpha = 1 - phase(time, T.textFadeStart, T.textFadeEnd);
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, W, H);
  if (paperAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = paperAlpha;
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  drawTitleText(ctx, textAlpha, paperAlpha);
}

function drawScanlines(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = C.deep;
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  ctx.restore();
}

const CH03_EVENTS: Array<{ t: number; key: Ch03Sfx }> = [
  { t: 0.15, key: 'hiss' },
  { t: 1.85, key: 'hiss' },
  { t: 2.85, key: 'focus' },
  { t: T.done, key: 'tick' },
  { t: T.flipStart, key: 'tick' },
  { t: T.barsStart, key: 'tick' },
  ...BAR_TIMES.map((t) => ({ t, key: 'cut' as Ch03Sfx })),
  ...BEATS.map((t) => ({ t, key: 'heartbeat' as Ch03Sfx })),
  { t: T.shatter, key: 'shatter' },
  { t: T.flipTitleStart, key: 'tick' },
  { t: T.titleStart, key: 'stamp' },
];

CH03_EVENTS.sort((a, b) => a.t - b.t);

export const CH03_SFX = CH03_EVENTS;

export function drawCh03(ctx: CanvasRenderingContext2D, time: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = false;

  if (time < T.flipStart) {
    const value = loadValue(time);
    const bands = Math.floor(value * 10 + 0.001);
    const cold =
      time >= T.holdStart - 0.05 && time < T.jumpEnd ? clamp(1 - Math.abs(value - 0.5) * 3) : 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(FRAME.x, FRAME.y, FRAME.w, FRAME.h);
    ctx.clip();
    drawCity(ctx, time, bands, cold);
    ctx.restore();
    drawFrame(ctx);
    drawProgress(ctx, value);
  } else if (time < T.shatter) {
    if (time < T.flipEnd) {
      drawFlip(ctx, time);
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.rect(FRAME.x, FRAME.y, FRAME.w, FRAME.h);
      ctx.clip();
      drawHeartScene(ctx, time);
      ctx.restore();
      drawFrame(ctx);
    }
  } else if (time < T.flipTitleStart) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(FRAME.x, FRAME.y, FRAME.w, FRAME.h);
    ctx.clip();
    drawShatter(ctx, time);
    ctx.restore();
    drawFrame(ctx);
  } else if (time < T.titleStart) {
    drawTitleFlip(ctx, time);
  } else {
    drawTitlePage(ctx, time);
  }

  if (time < T.titleStart) drawScanlines(ctx);
}
