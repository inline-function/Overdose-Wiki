import { existsSync, statSync } from 'node:fs';

const required = [
  'dist/index.html',
  'dist/assets-private',
  'dist/assets-private/bg',
  'dist/assets-private/effects',
  'dist/assets-private/audio/drug-war.wav',
  'dist/robots.txt',
];

let failed = false;
for (const path of required) {
  if (!existsSync(path)) {
    console.error(`missing: ${path}`);
    failed = true;
  }
}

if (existsSync('dist/assets-private/bg')) {
  const count = (await import('node:fs')).readdirSync('dist/assets-private/bg').length;
  console.log(`private backgrounds: ${count}`);
  if (count < 10) {
    console.error('private backgrounds look incomplete');
    failed = true;
  }
}

if (existsSync('dist/index.html')) {
  const bytes = statSync('dist/index.html').size;
  console.log(`index.html: ${bytes} bytes`);
  if (bytes < 500) {
    console.error('index.html looks empty');
    failed = true;
  }
}

if (failed) {
  console.error('deploy:check failed: this does not look like a private build');
  process.exit(1);
}
console.log('deploy:check OK: private build looks complete');
