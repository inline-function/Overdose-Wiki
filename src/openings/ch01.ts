export const CH01_DURATION = 14;

const W = 352;
const H = 198;
const CX = 176;
const CY = 118;
const FINAL_Y = 96;
const R = 58;
// 实轴与虚轴共用同一长度：画布 198 高、原点在 y=118，上下对称能放下的最大半长是 80。
const AXIS_LEN = 80;

const C = {
  bg: '#0b0a10',
  axis: '#e8e0cc',
  axisDim: '#5a5448',
  circle: '#8fa8b8',
  root: '#f0c866',
  nonreal: '#d8b89a',
  cut: '#a62b20',
  title: '#f3ead8',
  titleEn: '#8fa8b8',
  flash: '#f3ead8',
  spark: '#ffffff',
  ember: '#e2502f',
};

// 阶段时间窗（与 CH01_SFX 一一对应）。
const T = {
  enterStart: 0.9,
  enterEnd: 2.1,
  copyStart: 2.1,
  copyEnd: 2.9,
  circleStart: 3.1,
  circleEnd: 4.3,
  rootStart: 4.3,
  rootEnd: 5.5,
  labelXStart: 2.15,
  labelXEnd: 2.55,
  labelOStart: 2.35,
  labelOEnd: 2.75,
  labelYStart: 2.95,
  labelYEnd: 3.35,
  rootLabelStart: 5.5,
  rootLabelEnd: 5.85,
  cutStart: 5.9,
  cutEnd: 7.0,
  shatterStart: 6.8,
  shatterEnd: 8.1,
  riseStart: 8.1,
  riseEnd: 9.6,
  negStart: 9.6,
  negEnd: 10.3,
  sweepStart: 10.3,
  sweepEnd: 11.9,
  shrinkStart: 11.9,
  shrinkEnd: 12.5,
  vanishStart: 12.5,
  vanishEnd: 12.95,
  fadeStart: 13.35,
  fadeEnd: 14,
};

export type Ch01Sfx = 'origin' | 'axis' | 'circle' | 'root0' | 'root1' | 'root2' | 'cut' | 'shatter' | 'write' | 'vanish';

export const CH01_SFX: Array<{ t: number; key: Ch01Sfx }> = [
  { t: 0.15, key: 'origin' },
  { t: 1.0, key: 'axis' },
  { t: 2.25, key: 'axis' },
  { t: 3.1, key: 'circle' },
  { t: 4.7, key: 'root0' },
  { t: 5.05, key: 'root1' },
  { t: 5.4, key: 'root2' },
  { t: 5.9, key: 'cut' },
  { t: 6.82, key: 'shatter' },
  { t: 8.2, key: 'axis' },
  { t: 10.5, key: 'write' },
  { t: 11.4, key: 'write' },
  { t: 12.5, key: 'vanish' },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smooth(t: number) {
  const value = clamp(t);
  return value * value * (3 - 2 * value);
}

function easeIn(t: number, power = 2.2) {
  return Math.pow(clamp(t), power);
}

function easeOut(t: number, power = 2.2) {
  return 1 - Math.pow(1 - clamp(t), power);
}

function phase(time: number, start: number, end: number) {
  return clamp((time - start) / Math.max(0.001, end - start));
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), size, size);
}

function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  size = 1,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    px(ctx, x1 + dx * t, y1 + dy * t, color, size);
  }
}

function arrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string,
  size = 6,
) {
  const back = 0.55;
  line(ctx, x, y, x - Math.cos(angle - back) * size, y - Math.sin(angle - back) * size, color);
  line(ctx, x, y, x - Math.cos(angle + back) * size, y - Math.sin(angle + back) * size, color);
}

function circle(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string) {
  if (radius < 1) return;
  const steps = Math.max(24, Math.ceil(2 * Math.PI * radius));
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    px(ctx, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, color);
  }
}

function arc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  from: number,
  to: number,
  color: string,
) {
  const steps = Math.max(2, Math.ceil(Math.abs(to - from) * radius));
  for (let i = 0; i <= steps; i += 1) {
    const angle = from + ((to - from) * i) / steps;
    px(ctx, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, color);
  }
}

function rootMark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = 4) {
  px(ctx, x, y, color, 2);
  px(ctx, x - size, y, color);
  px(ctx, x + size, y, color);
  px(ctx, x, y - size, color);
  px(ctx, x, y + size, color);
}

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

// 圆周炸开时飞散的弧段。
const FRAGMENTS = (() => {
  const random = seeded(0x01a1);
  return Array.from({ length: 54 }, (_, index) => ({
    angle: (index / 54) * Math.PI * 2 + random() * 0.16,
    length: 0.06 + random() * 0.2,
    drift: 34 + random() * 96,
    spin: (random() - 0.5) * 1.9,
    alpha: 0.5 + random() * 0.5,
    hot: random() < 0.35,
  }));
})();

// 圆周炸开时外射的直线碎屑。
const RADIAL = (() => {
  const random = seeded(0x02b3);
  return Array.from({ length: 30 }, () => ({
    angle: random() * Math.PI * 2,
    from: 0.18 + random() * 0.6,
    speed: 52 + random() * 92,
    life: 0.5 + random() * 0.55,
  }));
})();

// 虚数轴折断时从断口迸出的火星。
const CUT_SPARKS = (() => {
  const random = seeded(0x0c07);
  return Array.from({ length: 26 }, () => ({
    angle: random() * Math.PI * 2,
    speed: 30 + random() * 88,
    life: 0.32 + random() * 0.4,
    hot: random() < 0.45,
  }));
})();

// 正半轴旋转时的白色粒子。
const SWEEP_DUST = (() => {
  const random = seeded(0x05ee);
  return Array.from({ length: 46 }, (_, index) => ({
    birth: T.sweepStart + (index / 46) * 1.5 + random() * 0.03,
    radius: AXIS_LEN * (0.28 + random() * 0.7),
    drift: 10 + random() * 30,
    life: 0.28 + random() * 0.32,
    size: random() < 0.25 ? 2 : 1,
  }));
})();

// 虚数轴复制旋转时的白色粒子。
const COPY_DUST = (() => {
  const random = seeded(0x07d1);
  return Array.from({ length: 12 }, (_, index) => ({
    birth: T.copyStart + (index / 12) * 0.68 + random() * 0.02,
    radius: AXIS_LEN * (0.3 + random() * 0.68),
    drift: 8 + random() * 18,
    life: 0.22 + random() * 0.26,
  }));
})();

const ROOT_ANGLES = [0, -(Math.PI * 2) / 3, (Math.PI * 2) / 3];

function drawEnglish(ctx: CanvasRenderingContext2D, y: number, alpha: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = C.titleEn;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '10px "Fusion Pixel 10 Patch", "Fusion Pixel 10", monospace';
  const text = 'IMAGINARY ROOTS';
  const gap = 2;
  const widths = [...text].map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * (text.length - 1);
  let x = Math.round(CX - total / 2);
  [...text].forEach((char, index) => {
    ctx.fillText(char, x, Math.round(y));
    x += widths[index] + gap;
  });
  ctx.restore();
}

function drawChinese(ctx: CanvasRenderingContext2D, originX: number, originY: number, sweep: number) {
  if (sweep <= 0.02) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  const steps = 30;
  for (let i = 0; i <= steps; i += 1) {
    const angle = -sweep * (i / steps);
    ctx.lineTo(originX + Math.cos(angle) * 240, originY + Math.sin(angle) * 240);
  }
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = C.title;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '24px "Fusion Pixel 12 Patch", "Fusion Pixel 12", monospace';
  ctx.fillText('虚数根', CX, 72);
  ctx.restore();
}

function drawDust(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  orbit: number,
  radius: number,
  age: number,
  drift: number,
  alpha: number,
  size: number,
) {
  const x = ox + Math.cos(orbit) * (radius + drift * age);
  const y = oy + Math.sin(orbit) * (radius + drift * age);
  ctx.save();
  ctx.globalAlpha = alpha;
  px(ctx, x, y, C.spark, size);
  ctx.restore();
}

function pixelFont(size: 8 | 10 | 12) {
  return `${size}px "Fusion Pixel ${size} Patch", "Fusion Pixel ${size}", monospace`;
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  alpha: number,
  color: string,
  size: 8 | 10 | 12 = 10,
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = pixelFont(size);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(text, Math.round(x), Math.round(y));
  ctx.restore();
}

// 根标签：x 用 10px，下标数字用 8px 并压下 4px。
function drawRootLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  digit: string,
  alpha: number,
  color: string,
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.font = pixelFont(10);
  const width = Math.ceil(ctx.measureText('x').width);
  ctx.restore();
  drawText(ctx, 'x', x, y, alpha, color, 10);
  drawText(ctx, digit, x + width, y + 4, alpha, color, 8);
}

export function drawCh01(ctx: CanvasRenderingContext2D, time: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  const originPulse = 2 + Math.sin(time * 8) * 1.5;
  const enter = easeOut(phase(time, T.enterStart, T.enterEnd));
  const copy = easeIn(phase(time, T.copyStart, T.copyEnd));
  const cut = phase(time, T.cutStart, T.cutEnd);
  const shatter = phase(time, T.shatterStart, T.shatterEnd);
  const rise = easeOut(phase(time, T.riseStart, T.riseEnd));
  const axisY = CY + (FINAL_Y - CY) * rise;
  const circleRadius = R * easeOut(phase(time, T.circleStart, T.circleEnd));
  const rootProgress = smooth(phase(time, T.rootStart, T.rootEnd));
  const negativeProgress = easeOut(phase(time, T.negStart, T.negEnd));
  const sweep = Math.PI * easeOut(phase(time, T.sweepStart, T.sweepEnd));
  const positiveShrink = easeOut(phase(time, T.shrinkStart, T.shrinkEnd));
  const vanish = phase(time, T.vanishStart, T.vanishEnd);
  const endFade = phase(time, T.fadeStart, T.fadeEnd);

  // 折断 / 炸裂的震屏。
  const cutShake = cut > 0 && cut < 0.45 ? (1 - cut / 0.45) * 3 : 0;
  const shatterShake = shatter > 0 && shatter < 0.3 ? (1 - shatter / 0.3) * 4 : 0;
  const amp = Math.max(cutShake, shatterShake);
  const shakeX = amp > 0 ? Math.round(Math.sin(time * 71) * amp) : 0;
  const shakeY = amp > 0 ? Math.round(Math.cos(time * 83) * amp * 0.6) : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // 实数轴自左穿入，穿过原点（先快后慢）。
  if (enter > 0 && time < 3.0) {
    const head = -8 + (CX + AXIS_LEN + 8) * enter;
    const tail = head - AXIS_LEN * 2;
    line(ctx, tail, CY, head, CY, C.axis);
    arrowHead(ctx, head, CY, 0, C.axis);
    for (let i = 0; i < 7; i += 1) {
      const flicker = 0.22 + 0.2 * Math.sin(time * 60 + i * 2.1);
      ctx.save();
      ctx.globalAlpha = flicker * (1 - i / 8);
      px(ctx, head - (5 + i * 4), CY + (i % 2 === 0 ? -1 : 1), C.spark);
      ctx.restore();
    }
  }

  // 虚数轴从实数轴复制而出（先慢后快）：正半轴从 +x 逆时针转 90°，负半轴从 −x 逆时针转 90°。
  if (copy > 0 && cut <= 0) {
    const angle = (-Math.PI / 2) * copy;
    const tipX = CX + Math.cos(angle) * AXIS_LEN;
    const tipY = CY + Math.sin(angle) * AXIS_LEN;
    const negAngle = Math.PI - (Math.PI / 2) * copy;
    const negTipX = CX + Math.cos(negAngle) * AXIS_LEN;
    const negTipY = CY + Math.sin(negAngle) * AXIS_LEN;
    // 两段同步起转：负半轴起步时会压在实轴上，画完再把实轴补回来，避免它看起来晚一步。
    line(ctx, CX, CY, negTipX, negTipY, C.axisDim);
    line(ctx, CX - AXIS_LEN, CY, CX, CY, C.axis);
    line(ctx, CX, CY, tipX, tipY, C.axis);
    arrowHead(ctx, tipX, tipY, angle, C.axis);
    COPY_DUST.forEach((dust) => {
      const age = time - dust.birth;
      if (age <= 0 || age >= dust.life) return;
      const orbit = (-Math.PI / 2) * easeIn(phase(dust.birth, T.copyStart, T.copyEnd));
      const alpha = (1 - age / dust.life) * 0.7;
      drawDust(ctx, CX, CY, orbit, dust.radius, age, dust.drift, alpha, 1);
      drawDust(ctx, CX, CY, orbit + Math.PI, dust.radius, age, dust.drift, alpha, 1);
    });
  }

  // 虚数轴折断：两段反向飞出、断口迸火星。
  if (cut > 0 && vanish <= 0) {
    const fade = 1 - Math.pow(cut, 1.8);
    const upperAngle = -Math.PI / 2 - cut * 1.15;
    const lowerAngle = Math.PI / 2 - cut * 1.25;
    const ux = CX - cut * 34;
    const uy = CY - cut * 22;
    const lx = CX + cut * 36;
    const ly = CY + cut * 24;
    const upperTipX = ux + Math.cos(upperAngle) * AXIS_LEN;
    const upperTipY = uy + Math.sin(upperAngle) * AXIS_LEN;
    const lowerTipX = lx + Math.cos(lowerAngle) * AXIS_LEN;
    const lowerTipY = ly + Math.sin(lowerAngle) * AXIS_LEN;

    ctx.save();
    ctx.globalAlpha = fade;
    line(ctx, ux, uy, upperTipX, upperTipY, C.axis, 2);
    if (cut < 0.4) {
      arrowHead(ctx, upperTipX, upperTipY, upperAngle, C.axis, 7);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = fade * 0.75;
    line(ctx, lx, ly, lowerTipX, lowerTipY, C.axis, 2);
    line(ctx, lx, ly, lowerTipX, lowerTipY, C.axisDim);
    ctx.restore();

    // 断口冲击：两层白环向外扩。
    if (cut < 0.45) {
      const burst = cut / 0.45;
      ctx.save();
      ctx.globalAlpha = (1 - burst) * 0.9;
      circle(ctx, CX, CY, 4 + burst * 26, C.spark);
      ctx.globalAlpha = (1 - burst) * 0.55;
      circle(ctx, CX, CY, 2 + burst * 14, C.spark);
      ctx.restore();
    }

    // 断口热光。
    if (cut < 0.5) {
      const heat = 1 - cut / 0.5;
      ctx.save();
      ctx.globalAlpha = heat;
      px(ctx, CX, CY, C.spark, 3);
      px(ctx, CX - 3, CY + 1, C.ember, 2);
      px(ctx, CX + 3, CY - 1, C.ember, 2);
      px(ctx, CX + 1, CY - 4, C.spark);
      px(ctx, CX - 1, CY + 4, C.spark);
      ctx.restore();
    }

    // 断口裂缝。
    if (cut < 0.42) {
      const crack = 1 - cut / 0.42;
      ctx.save();
      ctx.globalAlpha = crack * 0.9;
      line(ctx, CX, CY, CX - 7, CY - 9, C.spark);
      line(ctx, CX, CY, CX + 8, CY - 5, C.ember);
      line(ctx, CX, CY, CX + 5, CY + 10, C.spark);
      line(ctx, CX, CY, CX - 9, CY + 6, C.ember);
      ctx.restore();
    }

    // 火星。
    const age = cut * 1.1;
    CUT_SPARKS.forEach((spark) => {
      if (age >= spark.life) return;
      const distance = spark.speed * age;
      const gx = CX + Math.cos(spark.angle) * distance;
      const gy = CY + Math.sin(spark.angle) * distance + 26 * age * age;
      ctx.save();
      ctx.globalAlpha = (1 - age / spark.life) * 0.95;
      px(ctx, gx, gy, spark.hot ? C.spark : C.ember, spark.hot ? 1 : 2);
      ctx.restore();
    });
  }

  // 单位圆（先快后慢地绽开）。
  if (circleRadius > 0 && shatter < 0.2) {
    circle(ctx, CX, CY, circleRadius, C.circle);
  }

  if (rootProgress > 0 && shatter < 0.98) {
    ROOT_ANGLES.forEach((angle, index) => {
      const x = CX + Math.cos(angle) * circleRadius * rootProgress;
      const y = CY + Math.sin(angle) * circleRadius * rootProgress;
      const isReal = index === 0;
      const blink = time > 5.0 ? 0.7 + Math.abs(Math.sin(time * 9 + index * 2)) * 0.3 : 1;
      if (shatter > 0 && !isReal) return;
      if (rise > 0) return;
      ctx.save();
      ctx.globalAlpha = blink;
      rootMark(ctx, x, y, isReal ? C.root : C.nonreal);
      ctx.restore();
    });
  }

  // 圆破碎：冲击环 + 弧段 + 直线碎屑。
  if (shatter > 0) {
    if (shatter < 0.92) {
      const ring = R + shatter * 104;
      ctx.save();
      ctx.globalAlpha = Math.pow(1 - shatter, 2.2);
      circle(ctx, CX, CY, ring, C.spark);
      circle(ctx, CX, CY, ring - 1, C.spark);
      ctx.globalAlpha = Math.pow(1 - shatter, 2.6) * 0.55;
      circle(ctx, CX, CY, ring + 4, C.circle);
      ctx.restore();
    }

    FRAGMENTS.forEach((fragment) => {
      const local = clamp(shatter * 1.7 - (fragment.drift - 34) / 130);
      if (local <= 0) return;
      const radius = R + fragment.drift * local;
      const angle = fragment.angle + fragment.spin * local;
      ctx.save();
      ctx.globalAlpha = fragment.alpha * (1 - local);
      arc(ctx, CX, CY, radius, angle, angle + fragment.length, fragment.hot ? C.spark : C.circle);
      ctx.restore();
    });

    const shardAge = shatter * 1.3;
    RADIAL.forEach((shard) => {
      if (shardAge >= shard.life) return;
      const radius = R * shard.from + shard.speed * shardAge;
      const x = CX + Math.cos(shard.angle) * radius;
      const y = CY + Math.sin(shard.angle) * radius;
      ctx.save();
      ctx.globalAlpha = (1 - shardAge / shard.life) * 0.9;
      line(
        ctx,
        x,
        y,
        x + Math.cos(shard.angle) * 7,
        y + Math.sin(shard.angle) * 7,
        C.spark,
      );
      ctx.restore();
    });

    [1, 2].forEach((index) => {
      if (shatter > 0.45) return;
      const angle = ROOT_ANGLES[index];
      const x = CX + Math.cos(angle) * (circleRadius + shatter * 42);
      const y = CY + Math.sin(angle) * (circleRadius + shatter * 42);
      ctx.save();
      ctx.globalAlpha = 1 - shatter;
      rootMark(ctx, x, y, C.nonreal);
      ctx.restore();
    });
  }

  // 实数轴上移（先快后慢）；负半轴收回原点（先快后慢）。
  if (time >= 3.0 && vanish < 1) {
    const axisLeft = CX - AXIS_LEN * (1 - negativeProgress);
    const positiveStatic = sweep <= 0 && positiveShrink < 1;
    const axisRight = positiveStatic ? CX + AXIS_LEN : CX;
    line(ctx, axisLeft, axisY, axisRight, axisY, C.axis);
    if (positiveStatic) arrowHead(ctx, axisRight, axisY, 0, C.axis);

    if (time < 8.1 && rootProgress > 0 && shatter <= 0) {
      ctx.save();
      ctx.globalAlpha = time > 5.0 ? 0.7 + Math.abs(Math.sin(time * 9)) * 0.3 : 1;
      rootMark(ctx, CX + R, CY, C.root);
      ctx.restore();
    }

    if (rise > 0) {
      ctx.save();
      ctx.globalAlpha = 1 - rise;
      rootMark(ctx, CX + R, axisY, C.root);
      ctx.restore();
    }
  }

  // 轴下留白处浮出英文。
  const englishAlpha = smooth(phase(time, 8.3, 9.5));
  if (englishAlpha > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, axisY + 2, W, H - axisY - 2);
    ctx.clip();
    drawEnglish(ctx, 118, englishAlpha);
    ctx.restore();
  }

  // 正半轴逆时针旋转（先快后慢），扫掉上半的中文标题。
  if (sweep > 0 && positiveShrink < 1) {
    const angle = -sweep;
    const remaining = 1 - positiveShrink;
    const tipX = CX + Math.cos(angle) * AXIS_LEN * remaining;
    const tipY = axisY + Math.sin(angle) * AXIS_LEN * remaining;
    for (let trail = 6; trail >= 1; trail -= 1) {
      const trailAngle = angle + trail * 0.035;
      ctx.save();
      ctx.globalAlpha = 0.12 * (1 - trail / 7);
      line(
        ctx,
        CX,
        axisY,
        CX + Math.cos(trailAngle) * AXIS_LEN * remaining,
        axisY + Math.sin(trailAngle) * AXIS_LEN * remaining,
        C.axis,
      );
      ctx.restore();
    }
    line(ctx, CX, axisY, tipX, tipY, C.axis);
    arrowHead(ctx, tipX, tipY, angle, C.axis);
    drawChinese(ctx, CX, axisY, sweep);

    SWEEP_DUST.forEach((dust) => {
      const age = time - dust.birth;
      if (age <= 0 || age >= dust.life) return;
      const orbit = -Math.PI * easeOut(phase(dust.birth, T.sweepStart, T.sweepEnd));
      drawDust(
        ctx,
        CX,
        axisY,
        orbit,
        dust.radius,
        age,
        dust.drift,
        (1 - age / dust.life) * (0.55 + 0.45 * (dust.radius / AXIS_LEN)),
        dust.size,
      );
    });
  } else if (sweep >= Math.PI) {
    drawChinese(ctx, CX, axisY, Math.PI);
  }

  // 原点：脉动 → 闪光 → 熄灭。
  if (vanish < 0.55) {
    ctx.save();
    ctx.globalAlpha = vanish > 0 ? 1 - vanish / 0.55 : 1;
    ctx.fillStyle = C.axis;
    const size = Math.max(2, Math.round(originPulse + vanish * 3));
    ctx.fillRect(Math.round(CX - size / 2), Math.round(axisY - size / 2), size, size);
    ctx.restore();
  } else if (vanish < 0.8) {
    ctx.fillStyle = C.flash;
    ctx.fillRect(CX - 5, axisY - 5, 10, 10);
  }

  // 坐标标签：O 在原点左下，x 在实轴箭头处，y 在虚轴箭头处；元素消失时标签一起淡出。
  const labelX = smooth(phase(time, T.labelXStart, T.labelXEnd)) * (1 - phase(time, T.sweepStart, T.sweepStart + 0.25));
  if (labelX > 0) drawText(ctx, 'x', CX + AXIS_LEN + 5, axisY + 2, labelX, C.axis);

  const labelO = smooth(phase(time, T.labelOStart, T.labelOEnd)) * (1 - phase(time, T.vanishStart, T.vanishStart + 0.3));
  if (labelO > 0) drawText(ctx, 'O', CX - 11, axisY + 2, labelO, C.axis);

  const labelY = smooth(phase(time, T.labelYStart, T.labelYEnd)) * (1 - phase(time, T.cutStart, T.cutStart + 0.25));
  if (labelY > 0) drawText(ctx, 'y', CX - 14, CY - AXIS_LEN - 10, labelY, C.axis);

  // 三个根的下标标签：实根跟着实轴上移，非实根随圆一起破碎。
  const rootLabel = smooth(phase(time, T.rootLabelStart, T.rootLabelEnd));
  if (rootLabel > 0) {
    const realLabel = rootLabel * (1 - rise);
    if (realLabel > 0) drawRootLabel(ctx, CX + R + 7, axisY, '1', realLabel, C.root);
    const complexLabel = rootLabel * (1 - phase(time, T.shatterStart, T.shatterStart + 0.25));
    if (complexLabel > 0) {
      drawRootLabel(ctx, CX - 41, CY - 64, '2', complexLabel, C.nonreal);
      drawRootLabel(ctx, CX - 41, CY + 54, '3', complexLabel, C.nonreal);
    }
  }

  ctx.restore();

  // 断轴与碎圆的白闪。
  const cutFlash = cut > 0 && cut < 0.18 ? (1 - cut / 0.18) * 0.22 : 0;
  if (cutFlash > 0) {
    ctx.save();
    ctx.globalAlpha = cutFlash;
    ctx.fillStyle = C.cut;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  const shatterFlash = shatter > 0 && shatter < 0.22 ? (1 - shatter / 0.22) * 0.38 : 0;
  if (shatterFlash > 0) {
    ctx.save();
    ctx.globalAlpha = shatterFlash;
    ctx.fillStyle = C.flash;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (endFade > 0) {
    ctx.save();
    ctx.globalAlpha = endFade;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
