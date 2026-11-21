import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (existsSync('src/content/private/chapters')) {
  const result = spawnSync(process.execPath, ['tools/use-private.mjs'], {
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}
const result = spawnSync(process.execPath, ['tools/use-sample.mjs'], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);