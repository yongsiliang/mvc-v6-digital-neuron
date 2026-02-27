/**
 * ═══════════════════════════════════════════════════════════════════════
 * 代码执行工具
 * Code Execution Tool
 * 
 * 安全执行 Python、JavaScript、Shell 代码
 * ═══════════════════════════════════════════════════════════════════════
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { ToolExecutor, ToolResult, ExecutionContext } from '../types';

const execAsync = promisify(exec);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

// ─────────────────────────────────────────────────────────────────────
// 代码执行器
// ─────────────────────────────────────────────────────────────────────

export function createCodeExecutor(): ToolExecutor {
  return {
    definition: {
      name: 'code',
      displayName: '代码执行',
      description: '执行 Python、JavaScript、Shell 代码',
      category: 'code',
      dangerLevel: 'moderate',
      requiresConfirmation: false,
      timeout: 60000,
      parameters: [],
    },

    async execute(params: Record<string, unknown>, context: ExecutionContext): Promise<ToolResult> {
      const startTime = Date.now();
      const toolName = params._toolName as string;

      try {
        switch (toolName) {
          case 'code_run_python':
            return await runPython(params, context, startTime);
          case 'code_run_javascript':
            return await runJavaScript(params, context, startTime);
          case 'code_run_shell':
            return await runShell(params, context, startTime);
          default:
            return {
              callId: '',
              toolName: toolName || 'unknown',
              success: false,
              error: `未知的代码工具: ${toolName}`,
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
        }
      } catch (error) {
        return {
          callId: '',
          toolName: toolName || 'code',
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          duration: Date.now() - startTime,
          timestamp: Date.now(),
        };
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Python 执行
// ─────────────────────────────────────────────────────────────────────

async function runPython(
  params: Record<string, unknown>,
  context: ExecutionContext,
  startTime: number
): Promise<ToolResult> {
  const code = params.code as string;
  const packages = params.packages as string[] | undefined;
  
  // 创建临时文件
  const tmpDir = os.tmpdir();
  const scriptFile = path.join(tmpDir, `python_${Date.now()}.py`);
  
  try {
    // 如果需要安装包
    let installOutput = '';
    if (packages && packages.length > 0) {
      try {
        const installCmd = `pip install ${packages.join(' ')} -q`;
        const { stdout } = await execAsync(installCmd, { timeout: 60000 });
        installOutput = stdout;
      } catch (e) {
        // 忽略安装错误，可能包已存在
      }
    }

    // 写入代码
    await writeFile(scriptFile, code, 'utf-8');

    // 执行 Python
    const { stdout, stderr } = await execAsync(`python3 "${scriptFile}"`, {
      timeout: 30000,
      cwd: context.workingDirectory,
      env: { ...process.env, ...context.env },
    });

    return {
      callId: '',
      toolName: 'code_run_python',
      success: true,
      output: {
        stdout: stdout.substring(0, 10000),
        stderr: stderr.substring(0, 2000),
        packagesInstalled: packages || [],
      },
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  } finally {
    // 清理临时文件
    try {
      await unlink(scriptFile);
    } catch {
      // 忽略清理错误
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// JavaScript 执行
// ─────────────────────────────────────────────────────────────────────

async function runJavaScript(
  params: Record<string, unknown>,
  context: ExecutionContext,
  startTime: number
): Promise<ToolResult> {
  const code = params.code as string;
  const isTypeScript = params.typescript as boolean;
  
  const tmpDir = os.tmpdir();
  const ext = isTypeScript ? '.ts' : '.js';
  const scriptFile = path.join(tmpDir, `script_${Date.now()}${ext}`);
  
  try {
    // 包装代码以捕获输出
    const wrappedCode = `
const __originalLog = console.log;
const __originalError = console.error;
const __output = [];
const __errors = [];

console.log = (...args) => {
  __output.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
};
console.error = (...args) => {
  __errors.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
};

try {
  ${code}
} catch (e) {
  __errors.push(e.message);
} finally {
  console.log = __originalLog;
  console.error = __originalError;
  if (__output.length) console.log(__output.join('\\n'));
  if (__errors.length) console.error(__errors.join('\\n'));
}
`;

    await writeFile(scriptFile, wrappedCode, 'utf-8');

    // 执行 Node.js
    const cmd = isTypeScript ? `npx tsx "${scriptFile}"` : `node "${scriptFile}"`;
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 30000,
      cwd: context.workingDirectory,
      env: { ...process.env, ...context.env },
    });

    return {
      callId: '',
      toolName: 'code_run_javascript',
      success: true,
      output: {
        stdout: stdout.substring(0, 10000),
        stderr: stderr.substring(0, 2000),
        language: isTypeScript ? 'TypeScript' : 'JavaScript',
      },
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  } finally {
    try {
      await unlink(scriptFile);
    } catch {
      // 忽略
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Shell 执行
// ─────────────────────────────────────────────────────────────────────

async function runShell(
  params: Record<string, unknown>,
  context: ExecutionContext,
  startTime: number
): Promise<ToolResult> {
  const script = params.script as string;
  const interpreter = (params.interpreter as string) || 'bash';
  
  const tmpDir = os.tmpdir();
  const scriptFile = path.join(tmpDir, `script_${Date.now()}.sh`);
  
  try {
    await writeFile(scriptFile, script, 'utf-8');

    const { stdout, stderr } = await execAsync(`${interpreter} "${scriptFile}"`, {
      timeout: 60000,
      cwd: context.workingDirectory,
      env: { ...process.env, ...context.env },
    });

    return {
      callId: '',
      toolName: 'code_run_shell',
      success: true,
      output: {
        stdout: stdout.substring(0, 10000),
        stderr: stderr.substring(0, 2000),
        interpreter,
      },
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  } finally {
    try {
      await unlink(scriptFile);
    } catch {
      // 忽略
    }
  }
}
