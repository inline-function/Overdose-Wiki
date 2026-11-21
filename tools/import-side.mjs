import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = path.resolve('..', '重写文本', '支线');
const OUT = path.resolve('src', 'content', 'private', 'chapters', 'side.json');

const STAGE = {
  'side-32': 'bg_archive',
  'side-35': 'bg_river_night',
  'side-58': 'bg_archive',
  'side-83': 'bg_residential_path',
  'side-84': 'bg_river_night',
};

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

function chunk(text, max = 52) {
  const sentences = clean(text).split(/(?<=[。！？；])/).filter(Boolean);
  const chunks = [];
  let buffer = '';
  for (const sentence of sentences) {
    if ((buffer + sentence).length <= max) buffer += sentence;
    else {
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
  return chunks.length ? chunks : [clean(text)];
}

function frontmatter(text) {
  return text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)?.[1] ?? '';
}

function val(fm, key) {
  return fm.match(new RegExp(`^${key}:\s*(.*)$`, 'm'))?.[1]?.trim() ?? '';
}

function arr(fm, key) {
  const raw = val(fm, key);
  if (!raw.startsWith('[')) return [];
  return raw.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean);
}

const files = (await readdir(SRC)).filter((name) => /^side-\d+\.md$/.test(name)).sort();
const scenes = [];
for (const [index, file] of files.entries()) {
  const text = await readFile(path.join(SRC, file), 'utf8');
  const fm = frontmatter(text);
  const id = val(fm, 'id');
  const title = val(fm, 'title');
  const body = text
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
    .replace(/^#\s+.+$/m, '');
  const lines = body.split(/\r?\n/);
  const beats = [];
  let summary = '';
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      beats.push({ type: 'heading', text: clean(line.slice(3)) });
      continue;
    }
    if (line.startsWith('>')) {
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        const quote = clean(lines[i].trim().replace(/^>\s?/, ''));
        if (quote) {
          for (const chunkText of chunk(quote)) beats.push({ type: 'quote', text: chunkText });
          if (!summary) summary = quote;
        }
        i += 1;
      }
      i -= 1;
      continue;
    }
    const speaker = line.match(/^\*\*(.+?)\*\*(?:[（(]([^）)]+)[）)])?[：:]\s*(.*)$/);
    if (speaker) {
      const name = clean(speaker[1]);
      const textPart = speaker[3] ?? '';
      for (const chunkText of chunk(textPart)) {
        beats.push({ type: 'dialogue', speaker: name, text: chunkText });
        if (!summary) summary = chunkText;
      }
      continue;
    }
    for (const chunkText of chunk(line)) {
      beats.push({ type: 'narration', text: chunkText });
      if (!summary) summary = chunkText;
    }
  }
  if (id === 'side-83') {
    beats.push({ type: 'battle', battleId: 'battle-side-83', label: '门口的警车' });
  }
  const ref = arr(fm, 'source_refs')[0] ?? '';
  const reportNo = ref.match(/(\d+)/)?.[1];
  scenes.push({
    id,
    chapterId: 'side',
    order: index + 1,
    title,
    summary: summary.slice(0, 96),
    flags: arr(fm, 'content_flags'),
    sourceRefs: arr(fm, 'source_refs'),
    reportId: reportNo,
    reportSegment: reportNo ? `report-${reportNo}-full` : undefined,
    stage: {
      bg: STAGE[id] ?? 'bg_archive',
      bust: { speaker: id === 'side-83' ? '匿名' : '后藤', expr: 'calm' },
    },
    beats,
  });
}
await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(
  OUT,
  `${JSON.stringify({ id: 'side', title: '散页', scenes }, null, 2)}\n`,
  'utf8',
);
console.log(`side scenes: ${scenes.length}; beats: ${scenes.reduce((n, s) => n + s.beats.length, 0)}`);
