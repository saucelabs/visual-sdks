import { exec } from 'child_process';
import { FileHandle } from 'fs/promises';
import { ChildProcess } from 'node:child_process';

export type CommandResult = {
  statusCode: number;
  stdout: string;
  stderr: string;
};

export function execute(
  command: string,
  options: {
    cwd?: string;
    env?: { [key: string]: string };
    pipeOutput?: boolean;
    fileOutput?: FileHandle;
    displayOutputOnFailure?: boolean;
  } = { env: {} }
): Promise<CommandResult> {
  const execOpts = {
    cwd: options.cwd ?? process.cwd(),
    env: {
      ...process.env,
      ...options.env,
    },
  };

  return new Promise((resolve, reject) => {
    let stderr = '';
    let stdout = '';
    let output = '';

    const proc = exec(command, execOpts, async (err) => {
      if (err) {
        reject(err);
      }
    });

    proc.on('close', (statusCode: number) => {
      if (options.displayOutputOnFailure && statusCode !== 0) {
        process.stdout.write(output);
      }
      resolve({
        statusCode,
        stderr,
        stdout,
      });
    });

    proc.on('exit', (statusCode: number) => {
      if (options.displayOutputOnFailure && statusCode !== 0) {
        process.stdout.write(output);
      }
      resolve({
        statusCode,
        stderr,
        stdout,
      });
    });

    proc.stdout?.on('data', (chunk: any) => {
      stdout += chunk;
      output += chunk;
      options.fileOutput?.write(chunk);
      if (options.pipeOutput) {
        process.stdout.write(chunk);
      }
    });

    proc.stderr?.on('data', (chunk: any) => {
      stderr += chunk;
      output += chunk;
      options.fileOutput?.write(chunk);
      if (options.pipeOutput) {
        process.stderr.write(chunk);
      }
    });
  });
}

export type ExecuteResult = {
  childProcess: ChildProcess;
  shutdown: () => void;
};

export function executeInBackground(
  command: string,
  options: {
    cwd?: string;
    env?: { [key: string]: string };
    fileOutput?: FileHandle;
    pipeOutput?: boolean;
  }
): ExecuteResult {
  const execOpts = {
    cwd: options.cwd ?? process.cwd(),
    env: {
      ...process.env,
      ...(options.env ?? {}),
    },
  };

  const childProcess = exec(command, execOpts);

  childProcess.stdout?.on('data', (chunk: any) => {
    options.fileOutput?.write(chunk);
    if (options.pipeOutput) {
      process.stdout.write(chunk);
    }
  });

  childProcess.stderr?.on('data', (chunk: any) => {
    options.fileOutput?.write(chunk);
    if (options.pipeOutput) {
      process.stderr.write(chunk);
    }
  });

  const shutdown = () => {
    childProcess.stdout?.destroy();
    childProcess.stderr?.destroy();
    childProcess.stdin?.destroy();

    childProcess.kill();
  };

  return {
    childProcess,
    shutdown,
  };
}
