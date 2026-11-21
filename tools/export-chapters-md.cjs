const fs = require('node:fs');
const path = require('node:path');

const DIR = 'src/content/private/chapters';
const OUT = path.resolve('..', '微调');
fs.mkdirSync(OUT, { recursive: true });

const inline = (text) => String(text ?? '').replace(/\s*\n\s*/g, ' ').replace(/[ \t]+/g, ' ').trim();

for (const id of ['ch01', 'ch02', 'ch03', 'ch04']) {
  const chapter = JSON.parse(fs.readFileSync(path.join(DIR, id + '.json'), 'utf8'));
  const lines = ['# ' + chapter.title, ''];
  let count = 0;
  for (const scene of chapter.scenes) {
    for (const beat of scene.beats) {
      switch (beat.type) {
        case 'dialogue':
          lines.push('+ [' + inline(beat.speaker) + '] ' + inline(beat.text));
          break;
        case 'narration':
          lines.push('+(旁白) ' + inline(beat.text));
          break;
        case 'quote':
          lines.push('+(引用) ' + inline(beat.text));
          break;
        case 'heading':
          lines.push('+(标题) ' + inline(beat.text));
          break;
        case 'choice': {
          const options = (beat.options || []).map((option) => inline(option.label)).join(' / ');
          lines.push('+(选择) ' + options);
          break;
        }
        case 'battle':
          lines.push('+(复演：' + inline(beat.label || beat.battleId) + ')');
          break;
        case 'analysis':
          lines.push('+(精神分析：' + inline(beat.label || beat.caseId).replace(/：/g, '·') + ')');
          break;
        default:
          lines.push('+(' + beat.type + ')');
      }
      count += 1;
    }
  }
  const file = path.join(OUT, chapter.title + '.md');
  fs.writeFileSync(file, lines.join('\n') + '\n', 'utf8');
  console.log(id, chapter.title, 'beats', count, '->', file);
}
