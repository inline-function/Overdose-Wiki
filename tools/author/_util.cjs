const fs = require('node:fs');
const path = require('node:path');

const d = (speaker, text, fx, emotion) => ({ type: 'dialogue', speaker, text, ...(fx ? { fx } : {}), ...(emotion ? { emotion } : {}) });
const n = (text, fx) => ({ type: 'narration', text, ...(fx ? { fx } : {}) });
const q = (text, source) => ({ type: 'quote', text, ...(source ? { source } : {}) });
const h = (text) => ({ type: 'heading', text });
const choice = (id, targetScene) => ({
  type: 'choice',
  id,
  prompt: '选择',
  options: [
    { id: 'o1', label: '继续读下去', targetScene },
    { id: 'o2', label: '先把档案合上', note: '档案留在这里，随时可以再读', targetScene },
  ],
});

function write(chapterId, title, scenes, lastNext) {
  const full = scenes.map((s, i) => ({
    id: s.id,
    chapterId,
    order: i + 1,
    title: s.title,
    summary: s.summary,
    flags: [],
    sourceRefs: [],
    stage: { bg: s.bg, ...(s.bust ? { bust: { speaker: s.bust, expr: s.expr || 'calm' } } : {}) },
    ...(s.cue ? { cue: s.cue } : {}),
    ...(s.transition ? { transition: s.transition } : {}),
    beats: s.beats,
    next: i < scenes.length - 1 ? scenes[i + 1].id : lastNext,
  }));
  const file = path.resolve(__dirname, '../../src/content/private/chapters/' + chapterId + '.json');
  fs.writeFileSync(file, JSON.stringify({ id: chapterId, title, scenes: full }, null, 2) + '\n', 'utf8');
  console.log('wrote', file, scenes.length, 'scenes', full.reduce((a, s) => a + s.beats.length, 0), 'beats');
}

module.exports = { d, n, q, h, choice, write };
