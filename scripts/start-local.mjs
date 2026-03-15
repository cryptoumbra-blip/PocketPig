import { execSync } from 'node:child_process';
import { spawn } from 'node:child_process';
import { mkdirSync, openSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const logsDir = join(cwd, '.codex-local');
mkdirSync(logsDir, { recursive: true });

function killListeners(port) {
  try {
    const output = execSync(`lsof -ti tcp:${port}`, {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();

    if (!output) {
      return;
    }

    for (const pid of output.split('\n').map((value) => value.trim()).filter(Boolean)) {
      try {
        process.kill(Number(pid), 'SIGTERM');
      } catch {
        // Ignore stale or foreign processes we cannot stop.
      }
    }
  } catch {
    // No listener found.
  }
}

killListeners(3000);
killListeners(8787);

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
