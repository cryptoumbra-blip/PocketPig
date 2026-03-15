import { spawn } from 'node:child_process';

const commands = [
  {
    name: 'server',
    color: '\x1b[33m',
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'server:start'],
  },
  {
    name: 'web',
    color: '\x1b[36m',
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
  },
];

const children = commands.map((entry) => {
  const child = spawn(entry.command, entry.args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
  });

  const prefix = `${entry.color}[${entry.name}]\x1b[0m`;
  child.stdout.on('data', (chunk) => {
    process.stdout.write(`${prefix} ${chunk}`);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`${prefix} ${chunk}`);
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  return child;
});

function shutdown(signal) {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
