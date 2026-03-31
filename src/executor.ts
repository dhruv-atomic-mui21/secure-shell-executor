import { spawn } from 'child_process';
import { validateCommand } from './validator';

export interface ExecuteOptions {
  timeoutMs?: number;
  cwd?: string;
}

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  code: number | null;
  error?: string;
  status: 'pass' | 'fail' | 'timeout' | 'blocked';
}

/**
 * Securely executes a command after AST-based static analysis.
 * Wraps child processes in an AbortController for strict timeouts.
 */
export async function executeSecurely(command: string, options: ExecuteOptions = {}): Promise<ExecuteResult> {
  const timeoutMs = options.timeoutMs ?? 5000;

  // 1. Validation Phase (AST Parsing)
  const validation = validateCommand(command);
  if (!validation.valid) {
    return { 
      stdout: '', 
      stderr: '', 
      code: -1, 
      error: `Validation Failed: ${validation.reason}`,
      status: 'blocked'
    };
  }

  // 2. Execution Phase (AbortController wrapper)
  // Polyfill or use global AbortController available in newer Node.js versions
  const ac = new AbortController();
  const { signal } = ac;
  
  const timeoutId = setTimeout(() => ac.abort('TIMEOUT'), timeoutMs);

  return new Promise((resolve) => {
    // shell: true allows pipe operators and subshells, which is why AST validation is crucial
    const child = spawn(command, { shell: true, signal, cwd: options.cwd });
    
    // Prevent dangling Windows processes from keeping the Node Event Loop alive
    child.unref();

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: any) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: any) => {
      stderr += data.toString();
    });

    child.on('error', (err: any) => {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err.code === 'ABORT_ERR') {
        child.stdout?.destroy();
        child.stderr?.destroy();
        // Force kill the child process if it's still alive
        if (!child.killed) child.kill('SIGKILL');
        resolve({ stdout, stderr, code: null, error: 'Command timed out', status: 'timeout' });
      } else {
        resolve({ stdout, stderr, code: null, error: err.message, status: 'fail' });
      }
    });

    child.on('close', (code: number | null) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        resolve({ stdout, stderr, code, status: 'pass' });
      } else {
        // Did it fail due to abort signal? (Code can be null depending on OS/Node version)
        if (signal.aborted) {
          resolve({ stdout, stderr, code, error: 'Command timed out', status: 'timeout' });
        } else {
          resolve({ stdout, stderr, code, error: `Process exited with code ${code}`, status: 'fail' });
        }
      }
    });
  });
}
