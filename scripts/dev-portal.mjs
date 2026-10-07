#!/usr/bin/env node

import { spawn } from 'node:child_process';

const children = [];
let isShuttingDown = false;

function cleanup(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\n[dev:portal] Shutting down development services...');

  for (const child of children) {
    if (child && !child.killed) {
      try {
        child.kill('SIGTERM');
      } catch {
        // ignore
      }
    }
  }

  // Force kill fallback after 2 seconds
  setTimeout(() => {
    for (const child of children) {
      if (child && !child.killed) {
        try {
          child.kill('SIGKILL');
        } catch {
          // ignore
        }
      }
    }
    process.exit(exitCode);
  }, 2000).unref();
}

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));
process.on('exit', () => cleanup(0));

function startProcess(name, command, args) {
  console.log(`[dev:portal] Starting ${name} (${command} ${args.join(' ')})...`);
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  children.push(child);

  child.on('error', (err) => {
    console.error(`[dev:portal] ${name} error:`, err);
    cleanup(1);
  });

  child.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      console.log(`[dev:portal] ${name} exited with code ${code ?? signal}`);
      cleanup(code ?? 1);
    }
  });

  return child;
}

// 1. Start JSON Server (npm run server)
startProcess('JSON Server', 'npm', ['run', 'server']);

// 2. Start Vite (npm run dev)
startProcess('Vite Dev Server', 'npm', ['run', 'dev']);
