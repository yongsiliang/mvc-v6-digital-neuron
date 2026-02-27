/**
 * ═══════════════════════════════════════════════════════════════════════
 * 文件系统工具执行器
 * Filesystem Tool Executor
 * 
 * 实现所有文件系统相关操作的执行逻辑
 * ═══════════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import type { ToolExecutor, ToolResult, ExecutionContext } from '../types';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const appendFile = promisify(fs.appendFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const rename = promisify(fs.rename);
const copyFile = promisify(fs.copyFile);
const exists = promisify(fs.exists);

// ─────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 格式化文件大小
 */
function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * 格式化日期
 */
function formatDate(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 获取文件类型图标
 */
function getFileIcon(name: string, isDir: boolean): string {
  if (isDir) return '📁';
  const ext = path.extname(name).toLowerCase();
  const icons: Record<string, string> = {
    '.js': '📜', '.ts': '📜', '.jsx': '⚛️', '.tsx': '⚛️',
    '.py': '🐍', '.java': '☕', '.go': '🐹', '.rs': '🦀',
    '.html': '🌐', '.css': '🎨', '.scss': '🎨',
    '.json': '📋', '.xml': '📋', '.yaml': '📋', '.yml': '📋',
    '.md': '📝', '.txt': '📄', '.log': '📋',
    '.png': '🖼️', '.jpg': '🖼️', '.jpeg': '🖼️', '.gif': '🖼️', '.svg': '🖼️',
    '.mp3': '🎵', '.wav': '🎵', '.mp4': '🎬', '.avi': '🎬',
    '.zip': '📦', '.tar': '📦', '.gz': '📦',
    '.pdf': '📕', '.doc': '📘', '.docx': '📘', '.xls': '📗', '.xlsx': '📗',
    '.exe': '⚙️', '.sh': '🐚', '.bat': '🦇',
  };
  return icons[ext] || '📄';
}

/**
 * 解析路径（支持相对路径）
 */
function resolvePath(inputPath: string, workingDirectory: string): string {
  if (path.isAbsolute(inputPath)) {
    return path.normalize(inputPath);
  }
  return path.resolve(workingDirectory, inputPath);
}

// ─────────────────────────────────────────────────────────────────────
// 文件系统执行器
// ─────────────────────────────────────────────────────────────────────

export function createFilesystemExecutor(): ToolExecutor {
  return {
    definition: {
      name: 'filesystem',
      displayName: '文件系统操作',
      description: '文件和目录的读写操作',
      category: 'filesystem',
      dangerLevel: 'safe',
      requiresConfirmation: false,
      timeout: 30000,
      parameters: [],
    },

    async execute(params: Record<string, unknown>, context: ExecutionContext): Promise<ToolResult> {
      const startTime = Date.now();
      const toolName = params._toolName as string;
      const workingDir = context.workingDirectory;

      try {
        switch (toolName) {
          case 'fs_read_file':
            return await handleReadFile(params, workingDir, startTime);
          case 'fs_list_directory':
            return await handleListDirectory(params, workingDir, startTime);
          case 'fs_search':
            return await handleSearch(params, workingDir, startTime);
          case 'fs_get_info':
            return await handleGetInfo(params, workingDir, startTime);
          case 'fs_write_file':
            return await handleWriteFile(params, workingDir, startTime);
          case 'fs_append_file':
            return await handleAppendFile(params, workingDir, startTime);
          case 'fs_create_directory':
            return await handleCreateDirectory(params, workingDir, startTime);
          case 'fs_copy':
            return await handleCopy(params, workingDir, startTime);
          case 'fs_move':
            return await handleMove(params, workingDir, startTime);
          case 'fs_delete':
            return await handleDelete(params, workingDir, startTime, context.securityPolicy);
          default:
            return {
              callId: '',
              toolName: toolName || 'unknown',
              success: false,
              error: `未知的文件系统工具: ${toolName}`,
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
        }
      } catch (error) {
        return {
          callId: '',
          toolName: toolName || 'filesystem',
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
          duration: Date.now() - startTime,
          timestamp: Date.now(),
        };
      }
    },

    validateParams(params: Record<string, unknown>): { valid: boolean; errors: string[] } {
      const errors: string[] = [];
      // 基本验证可以在这里添加
      return { valid: errors.length === 0, errors };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// 各操作处理函数
// ─────────────────────────────────────────────────────────────────────

async function handleReadFile(
  params: Record<string, unknown>,
  workingDir: string,
  startTime: number
): Promise<ToolResult> {
  const filePath = resolvePath(params.path as string, workingDir);
  const startLine = (params.start_line as number) || 1;
  const maxLines = (params.max_lines as number) || 500;
  const encoding = (params.encoding as BufferEncoding) || 'utf-8';

  // 检查文件是否存在
  if (!(await exists(filePath))) {
    return {
      callId: '',
      toolName: 'fs_read_file',
      success: false,
      error: `文件不存在: ${filePath}`,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  // 读取文件
  const content = await readFile(filePath, encoding);
  const lines = content.split('\n');
  
  const endLine = params.end_line 
    ? Math.min(params.end_line as number, lines.length)
    : Math.min(startLine + maxLines - 1, lines.length);
  
  const selectedLines = lines.slice(startLine - 1, endLine);
  const stats = await stat(filePath);

  return {
    callId: '',
    toolName: 'fs_read_file',
    success: true,
    output: {
      path: filePath,
      content: selectedLines.join('\n'),
      totalLines: lines.length,
      displayedLines: selectedLines.length,
      startLine,
      endLine,
      size: stats.size,
      sizeFormatted: formatSize(stats.size),
    },
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

async function handleListDirectory(
  params: Record<string, unknown>,
  workingDir: string,
  startTime: number
): Promise<ToolResult> {
  const dirPath = resolvePath(params.path as string, workingDir);
  const pattern = params.pattern as string;
  const recursive = params.recursive as boolean;
  const includeHidden = params.include_hidden as boolean;
  const sortBy = (params.sort_by as string) || 'name';

  // 检查目录是否存在
  if (!(await exists(dirPath))) {
    return {
      callId: '',
      toolName: 'fs_list_directory',
      success: false,
      error: `目录不存在: ${dirPath}`,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  const dirStats = await stat(dirPath);
  if (!dirStats.isDirectory()) {
    return {
      callId: '',
      toolName: 'fs_list_directory',
      success: false,
      error: `不是目录: ${dirPath}`,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  // 读取目录内容
  const items = await readdir(dirPath, { withFileTypes: true });
  let results: Array<{
    name: string;
    type: 'file' | 'directory' | 'symlink';
    size?: number;
    modified?: Date;
    icon: string;
  }> = [];

  for (const item of items) {
    // 跳过隐藏文件
    if (!includeHidden && item.name.startsWith('.')) continue;

    // 模式匹配
    if (pattern && !matchPattern(item.name, pattern)) continue;

    const itemPath = path.join(dirPath, item.name);
    const stats = await stat(itemPath);
    
    results.push({
      name: item.name,
      type: item.isDirectory() ? 'directory' : item.isSymbolicLink() ? 'symlink' : 'file',
      size: stats.size,
      modified: stats.mtime,
      icon: getFileIcon(item.name, item.isDirectory()),
    });
  }

  // 排序
  results.sort((a, b) => {
    switch (sortBy) {
      case 'size':
        return (b.size || 0) - (a.size || 0);
      case 'modified':
        return (b.modified?.getTime() || 0) - (a.modified?.getTime() || 0);
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  // 格式化输出
  const formatted = results.map(item => ({
    ...item,
    sizeFormatted: item.size ? formatSize(item.size) : '-',
    modifiedFormatted: item.modified ? formatDate(item.modified) : '-',
  }));

  return {
    callId: '',
    toolName: 'fs_list_directory',
    success: true,
    output: {
      path: dirPath,
      items: formatted,
      total: formatted.length,
      directories: formatted.filter(i => i.type === 'directory').length,
      files: formatted.filter(i => i.type === 'file').length,
    },
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

async function handleSearch(
  params: Record<string, unknown>,
  workingDir: string,
  startTime: number
): Promise<ToolResult> {
  const searchPath = resolvePath(params.path as string, workingDir);
  const query = params.query as string;
  const searchType = (params.search_type as string) || 'name';
  const filePattern = params.file_pattern as string;
  const maxResults = (params.max_results as number) || 50;

  const results: Array<{
    path: string;
    name: string;
    type: string;
    match?: string;
    line?: number;
  }> = [];

  async function searchRecursive(dir: string): Promise<void> {
    const items = await readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      if (results.length >= maxResults) break;
      
      const itemPath = path.join(dir, item.name);
      
      // 跳过隐藏文件和常见排除目录
      if (item.name.startsWith('.') || ['node_modules', '.git', '__pycache__'].includes(item.name)) {
        continue;
      }

      if (item.isDirectory()) {
        await searchRecursive(itemPath);
      } else if (item.isFile()) {
        // 文件名搜索
        if (searchType === 'name' || searchType === 'both') {
          if (item.name.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              path: itemPath,
              name: item.name,
              type: 'filename_match',
            });
          }
        }

        // 内容搜索
        if ((searchType === 'content' || searchType === 'both') && 
            (results.length < maxResults)) {
          // 检查文件模式
          if (filePattern && !matchPattern(item.name, filePattern)) {
            continue;
          }

          // 只搜索文本文件
          const textExtensions = ['.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.json', '.yaml', '.yml', '.html', '.css', '.xml', '.sh'];
          if (!textExtensions.includes(path.extname(item.name).toLowerCase())) {
            continue;
          }

          try {
            const content = await readFile(itemPath, 'utf-8');
            const lines = content.split('\n');
            
            for (let i = 0; i < lines.length && results.length < maxResults; i++) {
              if (lines[i].toLowerCase().includes(query.toLowerCase())) {
                results.push({
                  path: itemPath,
                  name: item.name,
                  type: 'content_match',
                  match: lines[i].trim().substring(0, 100),
                  line: i + 1,
                });
              }
            }
          } catch {
            // 跳过无法读取的文件
          }
        }
      }
    }
  }

  await searchRecursive(searchPath);

  return {
    callId: '',
    toolName: 'fs_search',
    success: true,
    output: {
      query,
      searchType,
      results,
      total: results.length,
    },
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

async function handleGetInfo(
  params: Record<string, unknown>,
  workingDir: string,
  startTime: number
): Promise<ToolResult> {
  const filePath = resolvePath(params.path as string, workingDir);

  if (!(await exists(filePath))) {
    return {
      callId: '',
      toolName: 'fs_get_info',
      success: false,
      error: `路径不存在: ${filePath}`,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  const stats = await stat(filePath);
  
  return {
    callId: '',
    toolName: 'fs_get_info',
    success: true,
    output: {
      path: filePath,
      name: path.basename(filePath),
      type: stats.isDirectory() ? 'directory' : 'file',
      size: stats.size,
      sizeFormatted: formatSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      permissions: {
        readable: !!(stats.mode & fs.constants.R_OK),
        writable: !!(stats.mode & fs.constants.W_OK),
        executable: !!(stats.mode & fs.constants.X_OK),
      },
    },
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

async function handleWriteFile(
  params: Record<string, unknown>,
  workingDir: string,
  startTime: number
): Promise<ToolResult> {
  const filePath = resolvePath(params.path as string, workingDir);
  const content = params.content as string;
  const encoding = (params.encoding as BufferEncoding) || 'utf-8';
  const createDirs = params.create_dirs !== false;

  // 创建父目录
  if (createDirs) {
    const dir = path.dirname(filePath);
    await mkdir(dir, { recursive: true });
  }

  // 备份已存在的文件
  let backupPath: string | undefined;
  if (await exists(filePath)) {
    backupPath = `${filePath}.backup.${Date.now()}`;
    await copyFile(filePath, backupPath);
  }

  await writeFile(filePath, content, encoding);

  return {
    callId: '',
    toolName: 'fs_write_file',
    success: true,
    output: {
      path: filePath,
      size: Buffer.byteLength(content, encoding),
      sizeFormatted: formatSize(Buffer.byteLength(content, encoding)),
      backup: backupPath,
    },
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

async function handleAppendFile(
  params: Record<string, unknown>,
  workingDir: string,
  startTime: number
): Promise<ToolResult> {
  const filePath = resolvePath(params.path as string, workingDir);
  const content = params.content as string;
  const encoding = (params.encoding as BufferEncoding) || 'utf-8';

  await appendFile(filePath, content, encoding);

  const stats = await stat(filePath);

  return {
    callId: '',
    toolName: 'fs_append_file',
    success: true,
    output: {
      path: filePath,
      appendedSize: Buffer.byteLength(content, encoding),
      totalSize: stats.size,
    },
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

async function handleCreateDirectory(
  params: Record<string, unknown>,
  workingDir: string,
  startTime: number
): Promise<ToolResult> {
  const dirPath = resolvePath(params.path as string, workingDir);
  const recursive = params.recursive !== false;

  await mkdir(dirPath, { recursive });

  return {
    callId: '',
    toolName: 'fs_create_directory',
    success: true,
    output: {
      path: dirPath,
      created: true,
    },
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

async function handleCopy(
  params: Record<string, unknown>,
  workingDir: string,
  startTime: number
): Promise<ToolResult> {
  const source = resolvePath(params.source as string, workingDir);
  const destination = resolvePath(params.destination as string, workingDir);
  const overwrite = params.overwrite as boolean;

  if (!(await exists(source))) {
    return {
      callId: '',
      toolName: 'fs_copy',
      success: false,
      error: `源文件不存在: ${source}`,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  if (await exists(destination) && !overwrite) {
    return {
      callId: '',
      toolName: 'fs_copy',
      success: false,
      error: `目标已存在: ${destination}`,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  // 创建目标目录
  await mkdir(path.dirname(destination), { recursive: true });
  
  await copyFile(source, destination);

  const stats = await stat(destination);

  return {
    callId: '',
    toolName: 'fs_copy',
    success: true,
    output: {
      source,
      destination,
      size: stats.size,
    },
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

async function handleMove(
  params: Record<string, unknown>,
  workingDir: string,
  startTime: number
): Promise<ToolResult> {
  const source = resolvePath(params.source as string, workingDir);
  const destination = resolvePath(params.destination as string, workingDir);
  const overwrite = params.overwrite as boolean;

  if (!(await exists(source))) {
    return {
      callId: '',
      toolName: 'fs_move',
      success: false,
      error: `源文件不存在: ${source}`,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  if (await exists(destination) && !overwrite) {
    return {
      callId: '',
      toolName: 'fs_move',
      success: false,
      error: `目标已存在: ${destination}`,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  // 创建目标目录
  await mkdir(path.dirname(destination), { recursive: true });
  
  await rename(source, destination);

  return {
    callId: '',
    toolName: 'fs_move',
    success: true,
    output: {
      source,
      destination,
    },
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

async function handleDelete(
  params: Record<string, unknown>,
  workingDir: string,
  startTime: number,
  securityPolicy: ExecutionContext['securityPolicy']
): Promise<ToolResult> {
  const filePath = resolvePath(params.path as string, workingDir);
  const recursive = params.recursive as boolean;

  if (!(await exists(filePath))) {
    return {
      callId: '',
      toolName: 'fs_delete',
      success: false,
      error: `路径不存在: ${filePath}`,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  // 检查安全策略
  if (!securityPolicy.allowDelete) {
    return {
      callId: '',
      toolName: 'fs_delete',
      success: false,
      error: '安全策略禁止删除文件',
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  const stats = await stat(filePath);

  if (stats.isDirectory()) {
    if (recursive) {
      await fs.promises.rm(filePath, { recursive: true });
    } else {
      await fs.promises.rmdir(filePath);
    }
  } else {
    await unlink(filePath);
  }

  return {
    callId: '',
    toolName: 'fs_delete',
    success: true,
    output: {
      path: filePath,
      type: stats.isDirectory() ? 'directory' : 'file',
    },
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

// ─────────────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────────────

function matchPattern(name: string, pattern: string): boolean {
  // 简单的通配符匹配
  const regex = new RegExp(
    '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
    'i'
  );
  return regex.test(name);
}
