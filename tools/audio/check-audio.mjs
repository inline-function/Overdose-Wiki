import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const map = JSON.parse(readFileSync(resolve(import.meta.dirname, 'audio-map.json'), 'utf8'));
const manifest = readFileSync(resolve(root, 'src/audio/manifest.ts'), 'utf8');
const needed = new Set(map.tracks.map((track) => track.slug));
const referenced = new Set([...manifest.matchAll(/\/audio\/bgm\/([\w-]+)\.mp3/g)].map((match) => match[1]));

let total = 0;
for (const slug of needed) {
  const file = resolve(root, `public/audio/bgm/${slug}.mp3`);
  try {
    const size = statSync(file).size;
    if (size === 0 || size > 4_500_000) throw new Error(`bad size ${size}`);
    total += size;
  } catch {
    console.error(`missing or oversized cue: ${slug}.mp3`);
    process.exit(1);
  }
}

const missing = [...referenced].filter((slug) => !needed.has(slug));
if (missing.length) {
  console.error(`manifest references unknown cues: ${missing.join(', ')}`);
  process.exit(1);
}

const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
const credit = '音乐由[乌鸦Producer]提供';
if (!readme.includes(credit) || !manifest.includes(credit)) {
  console.error('missing 乌鸦Producer attribution in README or manifest');
  process.exit(1);
}

console.log(`audio:check: ${needed.size} cues · ${(total / 1024 / 1024).toFixed(1)}MB`);
console.log(credit);