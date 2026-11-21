import { existsSync } from 'node:fs';

if (!existsSync('src/content/private')) {
  console.error('build:private: src/content/private is missing. Refusing to build an empty private site.');
  process.exit(1);
}
