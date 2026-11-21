import { rm } from 'node:fs/promises';

await rm(new URL('../dist/assets-private', import.meta.url), { recursive: true, force: true });
console.log('demo build: stripped dist/assets-private');
