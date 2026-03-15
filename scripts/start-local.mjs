import { spawn } from 'node:child_process';
import { mkdirSync, openSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const logsDir = join(cwd, '.codex-local');
mkdirSync(logsDir, { recursive: true });

const entries = [
  {
    name: 'server',
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'server:start'],
    logPath: join(logsDir, 'server.log'),
  },
  {
    name: 'web',
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '3000'],
    logPath: join(logsDir, 'web.log'),
  },
];

for (const entry of entries) {
  const out = openSync(entry.logPath, 'a');
  const child = spawn(entry.command, entry.args, {
    cwd,
    detached: true,
    stdio: ['ignore', out, out],
    shell: false,
  });

  child.unref();
  console.log(`${entry.name} started (pid ${child.pid}) -> ${entry.logPath}`);
}
