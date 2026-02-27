/**
 * ═══════════════════════════════════════════════════════════════════════
 * 系统工具执行器
 * System Tool Executor
 * 
 * 实现系统信息获取、进程管理、命令执行等功能
 * ═══════════════════════════════════════════════════════════════════════
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import type { ToolExecutor, ToolResult, ExecutionContext } from '../types';

const execAsync = promisify(exec);

// ─────────────────────────────────────────────────────────────────────
// 系统工具执行器
// ─────────────────────────────────────────────────────────────────────

export function createSystemExecutor(): ToolExecutor {
  return {
    definition: {
      name: 'system',
      displayName: '系统操作',
      description: '系统信息和命令执行',
      category: 'system',
      dangerLevel: 'safe',
      requiresConfirmation: false,
      timeout: 60000,
      parameters: [],
    },

    async execute(params: Record<string, unknown>, context: ExecutionContext): Promise<ToolResult> {
      const startTime = Date.now();
      const toolName = params._toolName as string;

      try {
        switch (toolName) {
          case 'sys_info':
            return await handleSystemInfo(params, startTime);
          case 'sys_processes':
            return await handleProcesses(params, startTime);
          case 'sys_env':
            return await handleEnv(params, startTime, context);
          case 'sys_execute':
            return await handleExecute(params, startTime, context);
          default:
            return {
              callId: '',
              toolName: toolName || 'unknown',
              success: false,
              error: `未知的系统工具: ${toolName}`,
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
        }
      } catch (error) {
        return {
          callId: '',
          toolName: toolName || 'system',
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
// 各操作处理函数
// ─────────────────────────────────────────────────────────────────────

async function handleSystemInfo(
  params: Record<string, unknown>,
  startTime: number
): Promise<ToolResult> {
  const detail = params.detail as string;

  const basicInfo = {
    platform: os.platform(),
    type: os.type(),
    release: os.release(),
    arch: os.arch(),
    hostname: os.hostname(),
    uptime: formatUptime(os.uptime()),
    // CPU
    cpus: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'Unknown',
    // 内存
    totalMemory: os.totalmem(),
    totalMemoryFormatted: formatSize(os.totalmem()),
    freeMemory: os.freemem(),
    freeMemoryFormatted: formatSize(os.freemem()),
    usedMemory: os.totalmem() - os.freemem(),
    usedMemoryFormatted: formatSize(os.totalmem() - os.freemem()),
    memoryUsagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1),
    // 用户
    userInfo: os.userInfo(),
  };

  if (detail === 'full') {
    // 详细信息
    const loadAvg = os.loadavg();
    const networkInterfaces = os.networkInterfaces();
    
    return {
      callId: '',
      toolName: 'sys_info',
      success: true,
      output: {
        ...basicInfo,
        loadAverage: {
          '1m': loadAvg[0]?.toFixed(2),
          '5m': loadAvg[1]?.toFixed(2),
          '15m': loadAvg[2]?.toFixed(2),
        },
        networkInterfaces: Object.keys(networkInterfaces),
        tmpdir: os.tmpdir(),
        homedir: os.homedir(),
        endianness: os.endianness(),
        constants: {
          signals: Object.keys(os.constants.signals),
          errno: Object.keys(os.constants.errno),
        },
      },
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  return {
    callId: '',
    toolName: 'sys_info',
    success: true,
    output: basicInfo,
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

async function handleProcesses(
  params: Record<string, unknown>,
  startTime: number
): Promise<ToolResult> {
  const filter = params.filter as string;
  const sortBy = (params.sort_by as string) || 'cpu';
  const limit = (params.limit as number) || 20;

  let command: string;
  if (os.platform() === 'win32') {
    command = 'tasklist /fo csv';
  } else {
    command = 'ps aux --sort=-%cpu | head -n 50';
  }

  const { stdout } = await execAsync(command, { timeout: 10000 });
  
  let processes: Array<{
    pid?: string;
    name: string;
    cpu?: string;
    memory?: string;
    user?: string;
    command?: string;
  }> = [];

  if (os.platform() === 'win32') {
    // 解析 Windows CSV 输出
    const lines = stdout.split('\n').slice(1); // 跳过标题行
    processes = lines
      .filter(line => line.trim())
      .map(line => {
        const parts = line.match(/"([^"]*)"/g)?.map(s => s.replace(/"/g, '')) || [];
        return {
          name: parts[0] || '',
          pid: parts[1],
          memory: parts[4],
        };
      });
  } else {
    // 解析 Unix ps 输出
    const lines = stdout.split('\n').slice(1); // 跳过标题行
    processes = lines
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split(/\s+/);
        return {
          user: parts[0],
          pid: parts[1],
          cpu: parts[2],
          memory: parts[3],
          name: parts[10] || parts.slice(10).join(' '),
          command: parts.slice(10).join(' '),
        };
      });
  }

  // 过滤
  if (filter) {
    const lowerFilter = filter.toLowerCase();
    processes = processes.filter(p => 
      p.name.toLowerCase().includes(lowerFilter) ||
      p.command?.toLowerCase().includes(lowerFilter)
    );
  }

  // 排序
  processes.sort((a, b) => {
    switch (sortBy) {
      case 'memory':
        return parseFloat(b.memory || '0') - parseFloat(a.memory || '0');
      case 'pid':
        return parseInt(b.pid || '0') - parseInt(a.pid || '0');
      case 'name':
        return a.name.localeCompare(b.name);
      default: // cpu
        return parseFloat(b.cpu || '0') - parseFloat(a.cpu || '0');
    }
  });

  // 限制数量
  processes = processes.slice(0, limit);

  return {
    callId: '',
    toolName: 'sys_processes',
    success: true,
    output: {
      processes,
      total: processes.length,
      sortBy,
      filter: filter || null,
    },
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

async function handleEnv(
  params: Record<string, unknown>,
  startTime: number,
  _context: ExecutionContext
): Promise<ToolResult> {
  const action = params.action as string;
  const name = params.name as string;
  const value = params.value as string;

  switch (action) {
    case 'list':
      return {
        callId: '',
        toolName: 'sys_env',
        success: true,
        output: {
          variables: Object.entries(process.env).map(([k, v]) => ({ name: k, value: v })),
          count: Object.keys(process.env).length,
        },
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };

    case 'get':
      if (!name) {
        return {
          callId: '',
          toolName: 'sys_env',
          success: false,
          error: '缺少变量名',
          duration: Date.now() - startTime,
          timestamp: Date.now(),
        };
      }
      const envValue = process.env[name];
      return {
        callId: '',
        toolName: 'sys_env',
        success: true,
        output: {
          name,
          value: envValue || null,
          exists: envValue !== undefined,
        },
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };

    case 'set':
      if (!name) {
        return {
          callId: '',
          toolName: 'sys_env',
          success: false,
          error: '缺少变量名',
          duration: Date.now() - startTime,
          timestamp: Date.now(),
        };
      }
      // 注意：设置的环境变量只在当前进程有效
      process.env[name] = value || '';
      return {
        callId: '',
        toolName: 'sys_env',
        success: true,
        output: {
          name,
          value: value || '',
          message: `环境变量 ${name} 已设置（仅在当前进程有效）`,
        },
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };

    default:
      return {
        callId: '',
        toolName: 'sys_env',
        success: false,
        error: `未知操作: ${action}`,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
  }
}

async function handleExecute(
  params: Record<string, unknown>,
  startTime: number,
  context: ExecutionContext
): Promise<ToolResult> {
  const command = params.command as string;
  const args = params.args as string[] || [];
  const cwd = params.cwd as string || context.workingDirectory;
  const timeout = ((params.timeout as number) || 30) * 1000;

  // 构建完整命令
  let fullCommand = command;
  if (args.length > 0) {
    fullCommand += ' ' + args.map(a => `"${a}"`).join(' ');
  }

  // 检查命令是否在白名单中
  const baseCommand = command.split(' ')[0];
  if (context.securityPolicy.allowedCommands.length > 0) {
    const isAllowed = context.securityPolicy.allowedCommands.some(
      allowed => baseCommand === allowed || command.startsWith(allowed + ' ')
    );
    if (!isAllowed) {
      return {
        callId: '',
        toolName: 'sys_execute',
        success: false,
        error: `命令 "${baseCommand}" 不在允许列表中`,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  // 检查是否包含禁止的命令
  for (const blocked of context.securityPolicy.blockedCommands) {
    if (command.toLowerCase().includes(blocked.toLowerCase())) {
      return {
        callId: '',
        toolName: 'sys_execute',
        success: false,
        error: `命令包含禁止的操作: ${blocked}`,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  try {
    const { stdout, stderr } = await execAsync(fullCommand, {
      cwd,
      timeout: Math.min(timeout, context.securityPolicy.commandTimeout),
      maxBuffer: 1024 * 1024, // 1MB
      env: { ...process.env, ...context.env },
    });

    return {
      callId: '',
      toolName: 'sys_execute',
      success: true,
      output: {
        command: fullCommand,
        cwd,
        stdout: stdout.substring(0, 10000), // 限制输出长度
        stderr: stderr.substring(0, 1000),
        exitCode: 0,
      },
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; message: string };
    return {
      callId: '',
      toolName: 'sys_execute',
      success: false,
      error: execError.message,
      output: {
        command: fullCommand,
        cwd,
        stdout: execError.stdout?.substring(0, 10000),
        stderr: execError.stderr?.substring(0, 1000),
      },
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (mins > 0) parts.push(`${mins}分钟`);
  
  return parts.join(' ') || `${Math.floor(seconds)}秒`;
}
