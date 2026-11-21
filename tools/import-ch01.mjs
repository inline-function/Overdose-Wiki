import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('..');
const CHAPTERS = [
  { dir: 'ch01-孤独行者', id: 'ch01', title: '虚数根', lastNext: 'ch02.s01' },
  { dir: 'ch02-我看到好多彩色的虫子', id: 'ch02', title: '苦涩的颜料', lastNext: 'interlude.s01' },
  { dir: 'ch03-老师再也不见', id: 'ch03', title: '从此再也不见', lastNext: undefined },
  { dir: '幕间-报告51', id: 'interlude', title: '幕间 · 报告51', lastNext: 'ch03.s01' },
  { dir: 'dlc-稍尽春风', id: 'dlc', title: '稍尽春风', lastNext: undefined },
];
const OUT = path.resolve('src', 'content', 'private');

const REPORT_SEGMENT = {
  'ch01.s02': 'rp-7-1',
  'ch01.s02a': 'rp-7-1',
  'ch01.s03': 'rp-7-9',
  'ch01.s04': 'rp-7-9',
  'ch01.s04a': 'rp-7-9',
  'ch01.s05': 'rp-7-12',
  'ch01.s06': 'rp-7-13',
  'ch01.s07': 'rp-7-13',
  'ch01.s07a': 'rp-7-13',
  'ch01.s08': 'rp-7-13',
  'ch01.s09': 'rp-7-26',
};

const STAGE = {
  'ch01.s01': { bg: 'bg_archive', bust: { speaker: '后藤', expr: 'calm' } },
  'ch01.s02': { bg: 'bg_goto_room', bust: { speaker: '后藤', expr: 'calm' } },
  'ch01.s02a': { bg: 'bg_goto_room', bust: { speaker: '后藤', expr: 'tired' } },
  'ch01.s03': { bg: 'bg_river_night', bust: { speaker: '后藤', expr: 'tired' } },
  'ch01.s04': { bg: 'bg_goto_room', bust: { speaker: '后藤', expr: 'calm' } },
  'ch01.s04a': { bg: 'bg_goto_room', bust: { speaker: '后藤', expr: 'tired' } },
  'ch01.s05': { bg: 'bg_river_night', bust: { speaker: '后藤', expr: 'calm' } },
  'ch01.s06': { bg: 'bg_goto_room', bust: { speaker: '后藤', expr: 'tired' } },
  'ch01.s07': { bg: 'bg_river_day', bust: { speaker: '后藤', expr: 'calm' } },
  'ch01.s07a': { bg: 'bg_river_day', bust: { speaker: '后藤', expr: 'calm' } },
  'ch01.s08': { bg: 'bg_archive', bust: { speaker: '后藤', expr: 'intense' } },
  'ch01.s09': { bg: 'bg_goto_room', bust: { speaker: '后藤', expr: 'tired' } },
  'ch02.s01': { bg: 'bg_caijia_room', bust: { speaker: '彩加', expr: 'smile' } },
  'ch02.s01a': { bg: 'bg_caijia_room', bust: { speaker: '彩加', expr: 'smile' } },
  'ch02.s02': { bg: 'bg_caijia_room', bust: { speaker: '彩加', expr: 'tired' } },
  'ch02.s03': { bg: 'bg_caijia_room', bust: { speaker: '彩加', expr: 'blank' } },
  'ch02.s03a': { bg: 'bg_caijia_room', bust: { speaker: '彩加', expr: 'smile' } },
  'ch02.s04': { bg: 'bg_goto_room', bust: { speaker: '彩加', expr: 'intense' } },
  'ch02.s04a': { bg: 'bg_summer_street', bust: { speaker: '彩加', expr: 'smile' } },
  'ch02.s05': { bg: 'bg_caijia_room', bust: { speaker: '彩加', expr: 'blank' } },
  'ch02.s05a': { bg: 'bg_caijia_room', bust: { speaker: '管理人员', expr: 'tired' } },
  'ch02.s06': { bg: 'bg_residential_path', bust: { speaker: '彩加', expr: 'tired' } },
  'ch02.s07': { bg: 'bg_residential_path', bust: { speaker: '管理人员', expr: 'tired' } },
  'ch02.s08': { bg: 'bg_archive', bust: { speaker: '后藤', expr: 'tired' } },
  'ch02.s09': { bg: 'bg_archive', bust: { speaker: '后藤', expr: 'calm' } },
  'ch03.s01': { bg: 'bg_higan_home', bust: { speaker: '彼岸境', expr: 'polite' } },
  'ch03.s02': { bg: 'bg_higan_home', bust: { speaker: '彼岸境', expr: 'polite' } },
  'ch03.s02a': { bg: 'bg_higan_home', bust: { speaker: '彼岸境', expr: 'polite' } },
  'ch03.s03': { bg: 'bg_higan_home', bust: { speaker: '彼岸境', expr: 'calm' } },
  'ch03.s03a': { bg: 'bg_higan_home', bust: { speaker: '彼岸境', expr: 'polite' } },
  'ch03.s03b': { bg: 'bg_higan_home', bust: { speaker: '彼岸境', expr: 'polite' } },
  'ch03.s03c': { bg: 'bg_higan_home', bust: { speaker: '彼岸境', expr: 'tired' } },
  'ch03.s04': { bg: 'bg_higan_home', bust: { speaker: '彼岸境', expr: 'tired' } },
  'ch03.s05': { bg: 'bg_higan_home', bust: { speaker: '彼岸境', expr: 'tired' } },
  'ch03.s05a': { bg: 'bg_beijing', bust: { speaker: '彼岸境', expr: 'polite' } },
  'ch03.s05b': { bg: 'bg_beijing', bust: { speaker: '小郁', expr: 'tired' } },
  'ch03.s05c': { bg: 'bg_archive', bust: { speaker: '后藤', expr: 'intense' } },
  'ch03.s05d': { bg: 'bg_higan_home', bust: { speaker: '彼岸境', expr: 'tired' } },
  'ch03.s06': { bg: 'bg_higan_home', bust: { speaker: '后藤', expr: 'tired' } },
  'ch03.s07': { bg: 'bg_beijing', bust: { speaker: '后藤', expr: 'calm' } },
  'ch03.s08': { bg: 'bg_archive', bust: { speaker: '后藤', expr: 'tired' } },
  'dlc.s01': { bg: 'bg_dlc_classroom', bust: { speaker: '春风', expr: 'calm' } },
  'dlc.s02': { bg: 'bg_river_day', bust: { speaker: '春风', expr: 'calm' } },
  'dlc.s02a': { bg: 'bg_river_day', bust: { speaker: '春风', expr: 'calm' } },
  'dlc.s03': { bg: 'bg_dlc_classroom', bust: { speaker: '春风', expr: 'restless' } },
  'dlc.s03a': { bg: 'bg_dlc_night_market', bust: { speaker: '春风', expr: 'calm' } },
  'dlc.s04': { bg: 'bg_dlc_summer_street', bust: { speaker: '春风', expr: 'restless' } },
  'dlc.s04a': { bg: 'bg_river_day', bust: { speaker: '春风', expr: 'calm' } },
  'dlc.s05': { bg: 'bg_dlc_school_gate', bust: { speaker: '春风', expr: 'calm' } },
  'dlc.s06': { bg: 'bg_dlc_chunfeng_room', bust: { speaker: '我', expr: 'tired' } },
};

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return { data: {}, body: text };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    if (raw.startsWith('[') && raw.endsWith(']')) {
      data[key] = raw
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      data[key] = raw;
    }
  }
  return { data, body: text.slice(match[0].length) };
}

function clean(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]*\)/g, '$1')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function chunkText(text, max = 52) {
  const cleanText = clean(text);
  const sentences = cleanText.split(/(?<=[。！？；])/).filter(Boolean);
  const chunks = [];
  let buffer = '';
  for (const sentence of sentences) {
    if ((buffer + sentence).length <= max) {
      buffer += sentence;
    } else {
      if (buffer) chunks.push(buffer);
      buffer = sentence;
    }
    while (buffer.length > max) {
      let cut = Math.max(buffer.lastIndexOf('，', max), buffer.lastIndexOf('、', max));
      if (cut < 20) cut = max;
      chunks.push(buffer.slice(0, cut + 1).trim());
      buffer = buffer.slice(cut + 1).trim();
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks.length ? chunks : [cleanText];
}

function chunkQuote(lines) {
  const groups = [];
  let buffer = [];
  let length = 0;
  for (const line of lines) {
    if (!line) continue;
    if ((length + line.length > 48 || buffer.length >= 2) && buffer.length) {
      groups.push(buffer);
      buffer = [];
      length = 0;
    }
    buffer.push(line);
    length += line.length;
  }
  if (buffer.length) groups.push(buffer);
  return groups.length ? groups : [['']];
}

function resolveTarget(raw, sceneId, chapterId) {
  if (!raw) return {};
  const text = raw.trim();
  const scene = text.match(/场景\s*(\d+[a-z]?)/);
  if (scene) {
    const suffix = scene[1].padStart(2, '0');
    return { targetScene: `${chapterId}.s${suffix}` };
  }
  if (/幕间/.test(text)) return { targetScene: 'interlude.s01' };
  if (/ch0?2/i.test(text)) return { targetScene: 'ch02.s01' };
  if (/ch0?3/i.test(text)) return { targetScene: 'ch03.s01' };
  if (text.includes('进入战斗') || text === '战斗') {
    return { targetBattle: `battle-${sceneId.replace('.', '-')}` };
  }
  return { note: text };
}

function parseScene(file, text, nextId, config) {
  const { data, body } = parseFrontmatter(text);
  const id = data.id;
  const heading = body.match(/^#\s+(.+)$/m)?.[1] ?? id;
  const title = heading.replace(/^场景\s*\d+[a-z]?\s*·\s*/, '');
  const lines = body
    .slice(body.indexOf('\n'))
    .split(/\r?\n/)
    .slice(1);

  const beats = [];
  let pendingSource = '';
  let summary = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    const sourceMatch = line.match(/^\*\*档案引用\s*·\s*(.+?)\*\*$/);
    if (sourceMatch) {
      pendingSource = sourceMatch[1].trim();
      continue;
    }

    if (line === '**选择**' || line === '**选择：**') {
      const options = [];
      while (i + 1 < lines.length) {
        const next = lines[i + 1].trim();
        if (!next.startsWith('- ')) break;
        i += 1;
        const raw = clean(next.slice(2));
        const [labelPart, targetPart] = raw.split('→').map((part) => part.trim());
        const resolved = resolveTarget(targetPart ?? '', id, config.id);
        const option = {
          id: `o${options.length + 1}`,
          label: labelPart || raw,
          ...(resolved.targetScene ? { targetScene: resolved.targetScene } : {}),
          ...(resolved.targetBattle ? { targetBattle: resolved.targetBattle } : {}),
          ...(resolved.note ? { note: resolved.note } : {}),
        };
        options.push(option);
      }
      beats.push({ type: 'choice', id: `${id}.choice`, prompt: '选择', options });
      continue;
    }

    const battleMatch = line.match(/^\*\*战斗\s*·\s*(.+?)\*\*$/);
    if (battleMatch) {
      const label = battleMatch[1].trim();
      beats.push({
        type: 'battle',
        battleId: `battle-${id.replace('.', '-')}`,
        label,
      });
      while (i + 1 < lines.length && (lines[i + 1].trim().startsWith('- ') || !lines[i + 1].trim())) {
        i += 1;
      }
      continue;
    }

    if (line.startsWith('## ')) {
      beats.push({ type: 'heading', text: clean(line.slice(3)) });
      continue;
    }

    if (line.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(clean(lines[i].trim().replace(/^>\s?/, '')));
        i += 1;
      }
      i -= 1;
      chunkQuote(quoteLines).forEach((group, index) => {
        beats.push({
          type: 'quote',
          text: group.join('\n'),
          ...(index === 0 && pendingSource ? { source: pendingSource } : {}),
        });
      });
      pendingSource = '';
      if (!summary && quoteLines[0]) summary = quoteLines[0];
      continue;
    }

    const speakerMatch = line.match(/^\*\*(.+?)\*\*(?:[（(]([^）)]+)[）)])?[：:]\s*(.*)$/);
    if (speakerMatch) {
      const speaker = clean(speakerMatch[1]);
      const role = speakerMatch[2] ?? '';
      const textPart = speakerMatch[3] ?? '';
      let rest = textPart;
      if (!rest && i + 1 < lines.length) {
        rest = lines[i + 1].trim();
        i += 1;
      }
      for (const [index, chunk] of chunkText(rest).entries()) {
        if (role.includes('旁白')) {
          beats.push({ type: 'narration', speaker, text: chunk });
        } else {
          beats.push({ type: 'dialogue', speaker, text: chunk });
        }
        if (!summary && index === 0 && chunk) summary = chunk;
      }
      continue;
    }

    for (const chunk of chunkText(line)) {
      beats.push({ type: 'narration', text: chunk });
      if (!summary) summary = chunk;
    }
  }

  const order = Number(id.match(/s(\d+)/)?.[1] ?? 0);
  return {
    id,
    chapterId: config.id,
    order,
    title,
    summary: summary.slice(0, 96),
    flags: data.content_flags ?? [],
    sourceRefs: data.source_refs ?? [],
    ...(REPORT_SEGMENT[id] ? { reportSegment: REPORT_SEGMENT[id] } : {}),
    stage: stageFor(id),
    beats,
    ...(nextId ? { next: nextId } : {}),
  };
}

function stageFor(id) {
  if (STAGE[id]) return STAGE[id];
  if (id.startsWith('ch02')) {
    return { bg: 'bg_caijia_room', bust: { speaker: '彩加', expr: 'smile' } };
  }
  if (id.startsWith('ch03')) {
    return { bg: 'bg_higan_home', bust: { speaker: '彼岸境', expr: 'polite' } };
  }
  if (id.startsWith('dlc')) {
    return { bg: 'bg_dlc_classroom', bust: { speaker: '春风', expr: 'bright' } };
  }
  return { bg: 'bg_archive', bust: { speaker: '后藤', expr: 'calm' } };
}

async function importChapter(config) {
  const SRC = path.join(ROOT, '重写文本', '章节', config.dir);
  const files = (await readdir(SRC))
    .filter((name) => name.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const scenes = [];
  for (let index = 0; index < files.length; index += 1) {
    const text = await readFile(path.join(SRC, files[index]), 'utf8');
    const nextFile = files[index + 1];
    const nextId = nextFile
      ? parseFrontmatter(await readFile(path.join(SRC, nextFile), 'utf8')).data.id
      : undefined;
    scenes.push(parseScene(files[index], text, nextId, config));
  }

  for (const scene of scenes) {
    scene.beats = scene.beats.filter(
      (beat) => !(beat.type === 'narration' && beat.text.startsWith('# 场景')),
    );
    const choiceBattles = new Set(
      scene.beats
        .filter((beat) => beat.type === 'choice')
        .flatMap((beat) => beat.options)
        .map((option) => option.targetBattle)
        .filter(Boolean),
    );
    scene.beats = scene.beats.filter(
      (beat) => !(beat.type === 'battle' && choiceBattles.has(beat.battleId)),
    );
    for (const beat of scene.beats) {
      if (beat.type !== 'choice') continue;
      for (const option of beat.options) {
        if (!option.targetScene && !option.targetBattle && scene.next) {
          option.targetScene = scene.next;
        }
      }
    }
  }

  const last = scenes.at(-1);
  if (last && config.lastNext && !last.next) last.next = config.lastNext;
  const chapter = { id: config.id, title: config.title, scenes };
  await mkdir(path.join(OUT, 'chapters'), { recursive: true });
  await mkdir(path.join(OUT, 'reports'), { recursive: true });
  await writeFile(
    path.join(OUT, 'chapters', `${config.id}.json`),
    `${JSON.stringify(chapter, null, 2)}\n`,
    'utf8',
  );

  return chapter;
}

async function main() {
  const chapters = [];
  for (const config of CHAPTERS) chapters.push(await importChapter(config));

  const report = {
    id: '7',
    no: 7,
    title: '虚数根',
    reporter: '超级后后后藤',
    handler: '你',
    vitals: '175cm，60kg',
    drugs: '右美沙芬、咖啡因、金刚烷胺、茶苯海明、复方甘草片、氟伏沙明',
    edited: '最后编辑 2024-07-08 04:13',
    segments: [
      { id: 'rp-7-1', label: 'RP-7-1', date: '2022.08.27', summary: '我第一次 od。……醒来时如同发烧初愈。', sceneId: 'ch01.s02' },
      { id: 'rp-7-9', label: 'RP-7-9', date: '2023.06.03', summary: '地狱之行，昏迷不醒。昏睡严重地持续了四天。', sceneId: 'ch01.s03' },
      { id: 'rp-7-12', label: 'RP-7-12', date: '2023.07.11 11:46', summary: '感觉 suicide 好没有意义。突然就不想死了，想好好活着。', sceneId: 'ch01.s05' },
      { id: 'rp-7-13', label: 'RP-7-13', date: '2023.07.26', summary: '复刻失败。极度健忘；抑郁到就差一口盐。', sceneId: 'ch01.s06' },
      { id: 'rp-7-26', label: 'RP-7-26', date: '2024.02.27', summary: '最后一次 od。本次失败难以避免，但至少我们承受住了损失。', sceneId: 'ch01.s09' },
    ],
  };
  await writeFile(
    path.join(OUT, 'reports', 'report-007.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );
  await writeFile(
    path.join(OUT, 'manifest.json'),
    `${JSON.stringify({ chapters: ['ch01'], reports: ['7'] }, null, 2)}\n`,
    'utf8',
  );

  const allScenes = chapters.flatMap((chapter) => chapter.scenes);
  const choiceCount = allScenes.reduce(
    (sum, scene) => sum + scene.beats.filter((beat) => beat.type === 'choice').length,
    0,
  );
  console.log(`chapters: ${chapters.length}; scenes: ${allScenes.length}; beats: ${allScenes.reduce((n, s) => n + s.beats.length, 0)}; choices: ${choiceCount}`);
  for (const scene of allScenes) {
    const unresolved = scene.beats
      .filter((beat) => beat.type === 'choice')
      .flatMap((beat) => beat.options)
      .filter((option) => option.note && !option.targetScene && !option.targetBattle);
    if (unresolved.length) {
      console.log(`review ${scene.id}:`, unresolved.map((option) => option.label).join(' / '));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});