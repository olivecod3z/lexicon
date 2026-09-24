import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function build(folder, script, env = {}) {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
    cwd: `${root}/${folder}`, stdio: 'inherit', env: { ...process.env, ...env },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
build('landing', 'build:hosting');
// The hosted dashboard stores documents on-device until an authenticated API is available.
build('frontend', 'build', { VITE_HOSTING_PREVIEW: 'true' });
rmSync(`${root}/hosting-dist`, { recursive: true, force: true });
mkdirSync(`${root}/hosting-dist`, { recursive: true });
cpSync(`${root}/landing/out`, `${root}/hosting-dist`, { recursive: true });
cpSync(`${root}/frontend/dist`, `${root}/hosting-dist/dashboard`, { recursive: true });
console.log('Hosting build ready: landing at / and dashboard at /dashboard/.');
