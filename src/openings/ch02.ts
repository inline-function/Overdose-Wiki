export const CH02_DURATION = 14;

const W = 352;
const H = 198;
const CX = 176;
const CY = 99;
const GROUND = 194;

const C = {
  bg: '#0d0d14',
  ink: '#1a1a2e',
  inkDeep: '#0f0f1a',
  paper: '#e9e5d2',
  red: '#bf3b2b',
  blue: '#2f55c4',
  amber: '#e3b54a',
  pale: '#f4f1e2',
  white: '#ffffff',
  cool: '#8fa8b8',
  gray: '#34333a',
};

// 阶段时间窗。
const T = {
  appear: 0.55,
  spinStart: 0.8,
  spinEnd: 2.05,
  morphStart: 2.05,
  morphEnd: 2.95,
  crackStart: 3.0,
  burstStart: 4.35,
  bloomStart: 4.5,
  bloomEnd: 7.6,
  bugStart: 6.8,
  dropStart: 9.2,
  bugFallStart: 9.7,
  titleStart: 10.6,
  titleEnd: 12.9,
  colorFadeStart: 9.6,
  colorFadeEnd: 12.9,
  fadeOutStart: 13.4,
  fadeOutEnd: 14,
};

export type Ch02Sfx =
  | 'appear'
  | 'spin'
  | 'morph'
  | 'crack'
  | 'burst'
  | 'pop'
  | 'bugs'
  | 'drip'
  | 'fall'
  | 'write';

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

function phase(time: number, from: number, to: number) {
  return clamp((time - from) / (to - from));
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), size, size);
}

function ring(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string) {
  if (radius < 1) return;
  const steps = Math.max(20, Math.ceil(2 * Math.PI * radius));
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    px(ctx, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, color);
  }
}

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
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

const PAINT = [C.red, C.blue, C.amber, C.paper, C.pale, C.red, C.blue, C.amber];

// 一个个炸开的圆形颜料。第一朵在药片原地。
const BLOOMS = (() => {
  const random = seeded(0x2b01);
  const list: Array<{ x: number; y: number; r: number; birth: number; color: string; seed: number }> = [
    { x: CX, y: CY, r: 16, birth: T.bloomStart, color: C.amber, seed: 91 },
  ];
  for (let index = 0; index < 22; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = 16 + random() * 148;
    const x = clamp(CX + Math.cos(angle) * distance, 24, W - 24);
    const y = clamp(CY + Math.sin(angle) * distance, 16, H - 16);
    list.push({
      x,
      y,
      r: 14 + random() * 24,
      birth: T.bloomStart + 0.12 + (index / 22) * 2.5 + random() * 0.3,
      color: PAINT[Math.floor(random() * PAINT.length)],
      seed: Math.floor(random() * 900),
    });
  }
  return list.sort((a, b) => a.birth - b.birth);
})();

// 虫：从颜料里爬出来，颜色取与落点颜料不同的那几种。
const BUGS = (() => {
  const random = seeded(0x2b02);
  return Array.from({ length: 20 }, (_, index) => {
    const bloom = BLOOMS[1 + Math.floor(random() * (BLOOMS.length - 1))];
    const options = PAINT.filter((color) => color !== bloom.color);
    const angle = random() * Math.PI * 2;
    return {
      x0: bloom.x + Math.cos(angle) * 4,
      y0: bloom.y + Math.sin(angle) * 4,
      ux: Math.cos(angle + (random() - 0.5) * 0.9),
      uy: Math.sin(angle + (random() - 0.5) * 0.9),
      speed: 8 + random() * 13,
      wob: random() * Math.PI * 2,
      birth: T.bugStart + (index / 20) * 1.8 + random() * 0.25,
      fallAt: T.bugFallStart + index * 0.09 + random() * 0.07,
      color: options[Math.floor(random() * options.length)],
    };
  });
})();

// 最后落下的彩色水滴。
const DROPS = (() => {
  const random = seeded(0x2b03);
  return Array.from({ length: 32 }, () => ({
    x: 26 + random() * (W - 52),
    y0: 16 + random() * 150,
    birth: T.dropStart + random() * 2.3,
    len: 5 + random() * 12,
    color: PAINT[Math.floor(random() * PAINT.length)],
    speed: 26 + random() * 46,
  }));
})();

// 药片炸开时飞散的碎块。
const SHARDS = (() => {
  const random = seeded(0x2b04);
  return Array.from({ length: 26 }, (_, index) => ({
    angle: (index / 26) * Math.PI * 2 + random() * 0.3,
    speed: 40 + random() * 110,
    size: random() < 0.3 ? 3 : 2,
    color: PAINT[Math.floor(random() * PAINT.length)],
    life: 0.3 + random() * 0.45,
  }));
})();

export const CH02_SFX: Array<{ t: number; key: Ch02Sfx }> = [
  { t: 0.55, key: 'appear' },
  { t: 0.95, key: 'spin' },
  { t: 2.15, key: 'morph' },
  { t: 3.15, key: 'crack' },
  { t: 4.35, key: 'burst' },
  ...BLOOMS.filter((_, index) => index % 2 === 0).map((bloom) => ({
    t: bloom.birth,
    key: 'pop' as Ch02Sfx,
  })),
  { t: 6.9, key: 'bugs' },
  { t: 9.3, key: 'drip' },
  { t: 9.85, key: 'fall' },
  { t: 11.2, key: 'write' },
  { t: 12.4, key: 'write' },
];

// 药：旋转的胶囊 → 压成药片 → 停一会儿、裂开 → 炸开。
function drawDrug(ctx: CanvasRenderingContext2D, time: number) {
  const appear = smooth(phase(time, T.appear, T.appear + 0.3));
  if (appear <= 0) return;
  const spin = easeOut(phase(time, T.spinStart, T.spinEnd), 2.6);
  const morph = smooth(phase(time, T.morphStart, T.morphEnd));
  const crack = phase(time, T.crackStart, T.burstStart);

  const angle = -Math.PI * 1.55 * (1 - spin);
  const halfLen = 15 * (1 - morph);
  const pulse = 1 + 0.035 * Math.sin(time * 7) * clamp(crack * 3);
  const radius = (7 + 6 * morph) * pulse;
  const shakeX = crack > 0.55 ? Math.round(Math.sin(time * 104) * 1.6 * (crack - 0.55) * 2.2) : 0;
  const shakeY = crack > 0.55 ? Math.round(Math.cos(time * 87) * 1.2 * (crack - 0.55) * 2.2) : 0;

  const left = mix(C.red, C.pale, morph);
  const topColor = mix(C.paper, C.white, 0.45);
  const groove = mix(C.pale, C.ink, 0.32);
  const rim = mix(C.paper, C.ink, 0.4);

  // 停住时的余温：药片底下一圈很淡的暖光
  if (crack > 0.1) {
    ctx.save();
    ctx.globalAlpha = 0.1 + crack * 0.16;
    ring(ctx, CX, CY, radius + 3 + crack * 7, C.amber);
    ctx.restore();
  }

  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const reach = Math.ceil(halfLen + radius + 1);

  ctx.save();
  ctx.globalAlpha = appear;
  for (let y = -reach; y <= reach; y += 1) {
    for (let x = -reach; x <= reach; x += 1) {
      const u = x * cos - y * sin;
      const v = x * sin + y * cos;
      const inside =
        Math.abs(u) <= halfLen ? Math.abs(v) <= radius : Math.hypot(Math.abs(u) - halfLen, v) <= radius;
      if (!inside) continue;
      let color = u < 0 ? left : C.paper;
      if (morph > 0.72 && Math.abs(v) < 0.55 && Math.abs(u) < radius - 3) color = groove;
      else if (v < -radius + 2) color = topColor;
      else if (v > radius - 1.4) color = rim;
      px(ctx, CX + x + shakeX, CY + y + shakeY, color);
    }
  }
  // 高光点，停住时绕着药片转
  const glintAngle = morph > 0.9 ? time * 2.1 : -0.6;
  const glintU = Math.cos(glintAngle) * (radius - 3.5);
  const glintV = Math.sin(glintAngle) * (radius - 3.5);
  px(ctx, CX + glintU + shakeX, CY + glintV + shakeY, C.white, 2);
  ctx.restore();

  // 裂纹慢慢长出来
  if (crack > 0.05) {
    const grow = Math.min(1, crack * 1.15);
    for (let i = 0; i < 7; i += 1) {
      const crackAngle = (i / 7) * Math.PI * 2 + 0.35;
      const length = radius * grow;
      for (let s = 2; s < length; s += 2) {
        const jitterA = Math.sin(s * 1.7 + i) * 1.4;
        const jitterB = Math.cos(s * 1.3 + i * 2) * 1.4;
        px(
          ctx,
          CX + Math.cos(crackAngle) * s + jitterA + shakeX,
          CY + Math.sin(crackAngle) * s + jitterB + shakeY,
          C.inkDeep,
        );
      }
    }
  }
  // 炸之前的一点亮
  const charge = phase(time, T.burstStart - 0.32, T.burstStart);
  if (charge > 0) {
    ctx.save();
    ctx.globalAlpha = charge * 0.85;
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.arc(CX + shakeX, CY + shakeY, radius * charge, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 炸开：白闪、冲击环、碎块。
function drawBurst(ctx: CanvasRenderingContext2D, time: number) {
  const age = time - T.burstStart;
  if (age < 0 || age > 1.4) return;
  const flash = clamp(1 - age / 0.18);
  if (flash > 0) {
    ctx.save();
    ctx.globalAlpha = flash * 0.5;
    ctx.fillStyle = C.white;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (age < 0.55) {
    const radius = 5 + easeOut(age / 0.55) * 92;
    ring(ctx, CX, CY, radius, age < 0.2 ? C.white : C.paper);
    if (age < 0.4) ring(ctx, CX, CY, radius * 0.66, C.amber);
  }
  SHARDS.forEach((shard) => {
    const t = age - 0.02;
    if (t <= 0 || t > shard.life + 0.4) return;
    const travel = shard.speed * t * (1 - t * 0.3);
    const x = CX + Math.cos(shard.angle) * travel;
    const y = CY + Math.sin(shard.angle) * travel + t * t * 88;
    ctx.save();
    ctx.globalAlpha = clamp(1 - t / (shard.life + 0.4));
    px(ctx, x, y, shard.color, shard.size);
    px(ctx, x - Math.cos(shard.angle) * 2, y - Math.sin(shard.angle) * 2, shard.color);
    ctx.restore();
  });
}

function blob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  wobble: number,
  seed: number,
) {
  if (radius < 1) return;
  ctx.fillStyle = color;
  for (let y = -radius; y <= radius; y += 1) {
    const half = Math.sqrt(Math.max(0, radius * radius - y * y));
    if (half < 0.6) continue;
    const ragged = Math.sin((y + seed) * 0.9) * wobble;
    const x0 = Math.round(cx - half + ragged * 0.6);
    const width = Math.round(half * 2 + ragged * 0.6);
    if (width > 0) ctx.fillRect(x0, Math.round(cy + y), width, 1);
  }
}

// 一个个圆颜料炸开。
function drawBlooms(ctx: CanvasRenderingContext2D, time: number, fade: number) {
  BLOOMS.forEach((bloom) => {
    const age = time - bloom.birth;
    if (age <= 0) return;
    const pop = easeOut(clamp(age / 0.24), 3);
    const radius = bloom.r * pop;
    const color = mix(bloom.color, C.gray, fade);
    blob(ctx, bloom.x, bloom.y, radius, color, 1.6, bloom.seed);
    // 炸开瞬间的一圈和飞点
    if (age < 0.42) {
      const src = easeOut(clamp(age / 0.42), 2);
      ctx.save();
      ctx.globalAlpha = 1 - src;
      ring(ctx, bloom.x, bloom.y, radius * (1.02 + src * 0.5), mix(color, C.white, 0.45));
      ctx.restore();
    }
    if (age < 0.5) {
      const spray = easeOut(clamp(age / 0.5), 2);
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2 + bloom.seed;
        const d = radius * (0.9 + spray * 0.5);
        px(ctx, bloom.x + Math.cos(a) * d, bloom.y + Math.sin(a) * d, mix(color, C.white, 0.3), 1);
      }
    }
  });
}

function drawDrops(ctx: CanvasRenderingContext2D, time: number, fade: number) {
  DROPS.forEach((drop) => {
    const age = time - drop.birth;
    if (age <= 0) return;
    const y = drop.y0 + drop.speed * age + 46 * age * age;
    if (y > H + 14) return;
    const color = mix(drop.color, C.gray, fade * 0.55);
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(drop.x), Math.round(y - drop.len), 2, Math.round(drop.len));
    px(ctx, drop.x - 1, y, color, 3);
    ctx.restore();
  });
}

function drawBugs(ctx: CanvasRenderingContext2D, time: number) {
  BUGS.forEach((bug) => {
    const age = time - bug.birth;
    if (age <= 0) return;
    const walk = bug.speed * Math.min(age, bug.fallAt - bug.birth);
    const wobble = Math.sin(Math.min(age, bug.fallAt - bug.birth) * 5 + bug.wob) * 5;
    let x = bug.x0 + bug.ux * walk - bug.uy * wobble;
    let y = bug.y0 + bug.uy * walk + bug.ux * wobble;

    const fallAge = time - bug.fallAt;
    if (fallAge > 0) {
      y = Math.min(GROUND, y + 620 * fallAge * fallAge);
      if (y >= GROUND) {
        // 落地后摊平
        px(ctx, x, GROUND - 1, bug.color, 2);
        px(ctx, x - 2, GROUND - 1, C.inkDeep);
        px(ctx, x + 3, GROUND - 1, C.inkDeep);
        return;
      }
    }

    ctx.save();
    ctx.globalAlpha = clamp(age * 4);
    px(ctx, x, y, bug.color, 2);
    px(ctx, x + bug.ux * 2.5, y + bug.uy * 2.5, mix(bug.color, C.white, 0.4));
    px(ctx, x - bug.uy * 2, y + bug.ux * 2, C.inkDeep);
    px(ctx, x + bug.uy * 2, y - bug.ux * 2, C.inkDeep);
    ctx.restore();
  });
}

function drawTitle(ctx: CanvasRenderingContext2D, time: number) {
  const p = phase(time, T.titleStart, T.titleEnd);
  if (p <= 0) return;
  const alpha = smooth(clamp(p * 1.9));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = C.paper;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '24px "Fusion Pixel 12 Patch", "Fusion Pixel 12", monospace';
  // 先描一圈暗边，颜料还没褪干净时也压得住
  ctx.strokeStyle = C.inkDeep;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'miter';
  ctx.strokeText('苦涩的颜料', CX, 92);
  ctx.fillText('苦涩的颜料', CX, 92);
  ctx.restore();

  const english = smooth(clamp((p - 0.5) / 0.45));
  if (english > 0) {
    ctx.save();
    ctx.globalAlpha = english;
    ctx.fillStyle = C.cool;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '10px "Fusion Pixel 10 Patch", "Fusion Pixel 10", monospace';
    const text = 'BITTER PIGMENT';
    const gapWidth = 2;
    const widths = [...text].map((char) => ctx.measureText(char).width);
    const total = widths.reduce((sum, value) => sum + value, 0) + gapWidth * (text.length - 1);
    let x = Math.round(CX - total / 2);
    [...text].forEach((char, index) => {
      ctx.fillText(char, x, 118);
      x += widths[index] + gapWidth;
    });
    ctx.restore();
  }
}

export function drawCh02(ctx: CanvasRenderingContext2D, time: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  const fade = smooth(phase(time, T.colorFadeStart, T.colorFadeEnd));

  if (time < T.burstStart + 0.04) drawDrug(ctx, time);
  drawBlooms(ctx, time, fade);
  drawBurst(ctx, time);
  drawDrops(ctx, time, fade);
  drawBugs(ctx, time);
  drawTitle(ctx, time);

  const fadeOut = phase(time, T.fadeOutStart, T.fadeOutEnd);
  if (fadeOut > 0) {
    ctx.save();
    ctx.globalAlpha = fadeOut;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
