import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = path.resolve('..', '重写文本', '档案');
const OUT = path.resolve('src', 'content', 'private', 'reports');

function frontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  return match ? match[1] : '';
}

function value(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return match ? match[1].trim() : '';
}

function array(fm, key) {
  const raw = value(fm, key);
  if (!raw.startsWith('[')) return [];
  return raw.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean);
}

function clean(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]*\)/g, '$1')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function parseUnlock(raw) {
  if (!raw) return undefined;
  const body = raw.replace(/^\{/, '').replace(/\}$/, '');
  const result = {};
  for (const part of body.split(',')) {
    const [key, ...rest] = part.split(':');
    if (!key || !rest.length) continue;
    result[key.trim()] = rest.join(':').trim();
  }
  return Object.keys(result).length ? result : undefined;
}

function unquote(text) {
  return text.replace(/^["']|["']$/g, '');
}

function parseBody(text) {
  const bodyText = text
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
    .replace(/^#\s+.+$/m, '');
  const lines = bodyText.split(/\r?\n/);
  const body = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || line === '---' || /^\|[-: |]+\|$/.test(line)) continue;
    if (line.startsWith('## ')) {
      body.push({ type: 'h', text: clean(line.slice(3)) });
      continue;
    }
    if (line.startsWith('>')) {
      const quote = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(clean(lines[i].trim().replace(/^>\s?/, '')));
        i += 1;
      }
      i -= 1;
      body.push({ type: 'quote', text: quote.filter(Boolean).join('\n') });
      continue;
    }
    if (line.startsWith('|')) {
      const items = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i]
          .trim()
          .split('|')
          .slice(1, -1)
          .map((cell) => clean(cell));
        if (cells.some(Boolean) && !/^[-: ]+$/.test(cells.join(''))) {
          items.push(cells.join(' · '));
        }
        i += 1;
      }
      i -= 1;
      if (items.length) body.push({ type: 'list', items });
      continue;
    }
    if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(clean(lines[i].trim().slice(2)));
        i += 1;
      }
      i -= 1;
      body.push({ type: 'list', items });
      continue;
    }
    const paragraph = [clean(line)];
    while (
      i + 1 < lines.length &&
      lines[i + 1].trim() &&
      !/^(#|>|-|\||---)/.test(lines[i + 1].trim())
    ) {
      i += 1;
      paragraph.push(clean(lines[i].trim()));
    }
    body.push({ type: 'p', text: paragraph.join(' ') });
  }
  return body;
}

const files = (await readdir(SRC)).filter((name) => /^report-\d+\.md$/.test(name)).sort();
await mkdir(OUT, { recursive: true });

for (const file of files) {
  const text = await readFile(path.join(SRC, file), 'utf8');
  const fm = frontmatter(text);
  const no = Number(value(fm, 'report_no'));
  if (no === 7) continue;
  const title = unquote(value(fm, 'title'));
  const reporterMatch = value(fm, 'reporter').match(/display_name:\s*([^,}]+)/);
  const reporter = reporterMatch ? reporterMatch[1].trim() : '匿名报告者';
  const handler = unquote(value(fm, 'handler')) || '超级后后后藤';
  const height = value(fm, 'vitals').match(/height_cm:\s*([\d.]+)/)?.[1];
  const weight = value(fm, 'vitals').match(/weight_kg:\s*([\d.]+)/)?.[1];
  const drugs = array(fm, 'drugs');
  const recorded = unquote(value(fm, 'recorded_at'));
  const extended = unquote(value(fm, 'extended_at'));
  const unlockRaw = value(fm, 'unlock');
  let unlock = parseUnlock(unlockRaw);
  const unlockOverrides = {
    32: { chapter: 'ch03', scene: 'ch03.s04' },
    35: { chapter: 'ch01', scene: 'ch01.s04' },
    51: { kind: 'chapter', ref: 'ch02.s09' },
    58: { chapter: 'ch03', scene: 'ch03.s07' },
    74: { kind: 'chapter', ref: 'ch01.s09' },
    83: { chapter: 'ch02', scene: 'ch02.s09' },
  };
  if (unlockOverrides[no]) unlock = unlockOverrides[no];
  const ref = unlock?.ref ?? unlock?.scene;
  let sceneId = ref && /^(ch\d+|dlc|interlude)\./.test(ref) ? ref : undefined;
  if ([32, 35, 58, 83, 84].includes(no)) sceneId = `side-${no}`;
  if (no === 51) sceneId = 'interlude.s01';
  if (no === 74) sceneId = 'dlc.s01';
  const date = recorded.slice(0, 10).replaceAll('.', '-');
  const summary = sceneId
    ? `主文已拆入 ${sceneId}；档案保留表头、关键日期与互引。`
    : '本档案保留表头与互引，正文待 S3 接入。';
  const report = {
    id: String(no),
    no,
    title,
    reporter,
    handler,
    vitals: height && weight ? `${height}cm，${weight}kg` : '',
    drugs: drugs.join('、'),
    edited: extended ? `最后编辑 ${extended}` : `记入 ${recorded}`,
    ...(unlock ? { unlock } : {}),
    segments: [
      {
        id: `report-${no}-full`,
        label: '全文',
        date,
        summary,
        ...(sceneId ? { sceneId } : {}),
      },
    ],
    body: parseBody(text),
  };
  await writeFile(
    path.join(OUT, `report-${String(no).padStart(3, '0')}.json`),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );
  console.log(`report ${no}: ${sceneId ?? 'no scene'} · ${title} · ${report.body.length} blocks`);
}