import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = path.resolve('..', '重写文本', '效果');
const OUT = path.resolve('src', 'content', 'private', 'effects');

function clean(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]*\)/g, '$1')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function frontmatter(text) {
  return text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)?.[1] ?? '';
}

const files = (await readdir(SRC)).filter((name) => name.endsWith('.md')).sort();
await mkdir(OUT, { recursive: true });
let index = 0;
for (const file of files) {
  if (file === '解离.md') continue;
  const text = await readFile(path.join(SRC, file), 'utf8');
  const fm = frontmatter(text);
  const tags = (fm.match(/^tags:\s*\[(.*?)\]/m)?.[1] ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const title = text.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? file.replace(/\.md$/, '');
  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').replace(/^#\s+.+$/m, '');
  const lines = body.split(/\r?\n/);
  const blocks = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || line === '---' || line.startsWith('|')) continue;
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h', text: clean(line.slice(3)) });
      continue;
    }
    if (line.startsWith('>')) {
      const quote = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(clean(lines[i].trim().replace(/^>\s?/, '')));
        i += 1;
      }
      i -= 1;
      blocks.push({ type: 'quote', text: quote.filter(Boolean).join('\n') });
      continue;
    }
    if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(clean(lines[i].trim().slice(2)));
        i += 1;
      }
      i -= 1;
      blocks.push({ type: 'list', items });
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
    blocks.push({ type: 'p', text: paragraph.join(' ') });
  }
  const effect = { id: title, title, tags, blocks };
  await writeFile(
    path.join(OUT, `effect-${String(index).padStart(2, '0')}.json`),
    `${JSON.stringify(effect, null, 2)}\n`,
    'utf8',
  );
  console.log(`${title}: ${blocks.length} blocks`);
  index += 1;
}
