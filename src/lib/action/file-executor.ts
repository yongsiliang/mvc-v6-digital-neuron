/**
 * ═══════════════════════════════════════════════════════════════════════
 * 行动层 - 文件执行器
 * 
 * 支持文件操作：
 * - 读写文件
 * - 搜索文件内容
 * - 目录操作
 * 
 * 注意：在沙箱环境中，只能操作 /tmp 和允许的目录
 * ═══════════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';
import { ActionStructure } from '../info-field/structures';
import { ActionExecutor, ActionResult, ExecutorCapabilities } from './executor';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: Date;
  extension?: string;
}

interface SearchResult {
  file: string;
  line: number;
  content: string;
}

// ─────────────────────────────────────────────────────────────────────
// 文件执行器
// ─────────────────────────────────────────────────────────────────────

/**
 * 文件执行器
 * 
 * 执行文件系统操作
 */
export class FileExecutor implements ActionExecutor {
  readonly type = 'file';
  
  private allowedPaths: string[];
  private maxFileSize: number;
  
  constructor(options?: { allowedPaths?: string[]; maxFileSize?: number }) {
    // 默认允许的路径
    this.allowedPaths = options?.allowedPaths ?? ['/tmp', '/workspace'];
    this.maxFileSize = options?.maxFileSize ?? 10 * 1024 * 1024; // 10MB
  }
  
  getCapabilities(): ExecutorCapabilities {
    return {
      name: 'File Executor',
      description: '文件操作执行器，支持读写、搜索、目录操作',
      supportedActions: [
        'file-read',
        'file-write',
        'file-append',
        'file-delete',
        'file-list',
        'file-search',
        'file-exists',
        'file-copy',
        'file-move',
        'directory-create',
        'directory-list'
      ]
    };
  }
  
  canExecute(action: ActionStructure): boolean {
    return this.getCapabilities().supportedActions.includes(action.action);
  }
  
  async execute(action: ActionStructure): Promise<ActionResult> {
    // 检查路径权限
    const targetPath = this.resolvePath(action.target);
    if (!this.isPathAllowed(targetPath)) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `路径不在允许范围内: ${targetPath}`,
        completed: false
      };
    }
    
    switch (action.action) {
      case 'file-read':
        return this.readFile(action, targetPath);
      case 'file-write':
        return this.writeFile(action, targetPath);
      case 'file-append':
        return this.appendFile(action, targetPath);
      case 'file-delete':
        return this.deleteFile(action, targetPath);
      case 'file-list':
        return this.listFiles(action, targetPath);
      case 'file-search':
        return this.searchInFile(action, targetPath);
      case 'file-exists':
        return this.fileExists(action, targetPath);
      case 'file-copy':
        return this.copyFile(action, targetPath);
      case 'file-move':
        return this.moveFile(action, targetPath);
      case 'directory-create':
        return this.createDirectory(action, targetPath);
      case 'directory-list':
        return this.listFiles(action, targetPath);
      default:
        return {
          actionId: action.id,
          status: 'failed',
          content: '',
          error: `不支持的文件操作: ${action.action}`,
          completed: false
        };
    }
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 文件操作
  // ───────────────────────────────────────────────────────────────────
  
  private async readFile(action: ActionStructure, filePath: string): Promise<ActionResult> {
    try {
      // 检查文件大小
      const stats = await fs.promises.stat(filePath);
      if (stats.size > this.maxFileSize) {
        return {
          actionId: action.id,
          status: 'failed',
          content: '',
          error: `文件过大 (${stats.size} bytes)，最大允许 ${this.maxFileSize} bytes`,
          completed: false
        };
      }
      
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      const extracted = new Map<string, unknown>();
      extracted.set('content', content);
      extracted.set('size', stats.size);
      extracted.set('path', filePath);
      
      return {
        actionId: action.id,
        status: 'success',
        content: `读取文件: ${filePath}\n大小: ${stats.size} bytes\n\n${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}`,
        extracted,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `读取文件失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  private async writeFile(action: ActionStructure, filePath: string): Promise<ActionResult> {
    const content = action.value || '';
    
    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      await fs.promises.mkdir(dir, { recursive: true });
      
      await fs.promises.writeFile(filePath, content, 'utf-8');
      
      return {
        actionId: action.id,
        status: 'success',
        content: `写入文件成功: ${filePath}\n大小: ${content.length} bytes`,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `写入文件失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  private async appendFile(action: ActionStructure, filePath: string): Promise<ActionResult> {
    const content = action.value || '';
    
    try {
      await fs.promises.appendFile(filePath, content, 'utf-8');
      
      return {
        actionId: action.id,
        status: 'success',
        content: `追加内容成功: ${filePath}\n追加: ${content.length} bytes`,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `追加内容失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  private async deleteFile(action: ActionStructure, filePath: string): Promise<ActionResult> {
    try {
      await fs.promises.unlink(filePath);
      
      return {
        actionId: action.id,
        status: 'success',
        content: `删除文件成功: ${filePath}`,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `删除文件失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  private async listFiles(action: ActionStructure, dirPath: string): Promise<ActionResult> {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      const files: FileInfo[] = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dirPath, entry.name);
          const stats = await fs.promises.stat(fullPath);
          
          return {
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: stats.size,
            modifiedAt: stats.mtime,
            extension: entry.isFile() ? path.extname(entry.name) : undefined
          };
        })
      );
      
      const extracted = new Map<string, unknown>();
      extracted.set('files', files);
      extracted.set('count', files.length);
      extracted.set('path', dirPath);
      
      const summary = files
        .slice(0, 20)
        .map(f => `${f.isDirectory ? '📁' : '📄'} ${f.name} ${f.isDirectory ? '' : `(${this.formatSize(f.size)})`}`)
        .join('\n');
      
      return {
        actionId: action.id,
        status: 'success',
        content: `目录列表: ${dirPath}\n共 ${files.length} 项\n\n${summary}${files.length > 20 ? '\n...' : ''}`,
        extracted,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `列出目录失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  private async searchInFile(action: ActionStructure, filePath: string): Promise<ActionResult> {
    const keyword = action.value || '';
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const results: SearchResult[] = [];
      
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          results.push({
            file: filePath,
            line: index + 1,
            content: line.trim().substring(0, 200)
          });
        }
      });
      
      const extracted = new Map<string, unknown>();
      extracted.set('results', results);
      extracted.set('keyword', keyword);
      extracted.set('count', results.length);
      
      const summary = results
        .slice(0, 10)
        .map(r => `行 ${r.line}: ${r.content}`)
        .join('\n');
      
      return {
        actionId: action.id,
        status: 'success',
        content: `搜索 "${keyword}" 在 ${filePath}\n找到 ${results.length} 处匹配\n\n${summary}${results.length > 10 ? '\n...' : ''}`,
        extracted,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `搜索失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  private async fileExists(action: ActionStructure, filePath: string): Promise<ActionResult> {
    try {
      const exists = fs.existsSync(filePath);
      
      if (exists) {
        const stats = await fs.promises.stat(filePath);
        return {
          actionId: action.id,
          status: 'success',
          content: `文件存在: ${filePath}\n类型: ${stats.isDirectory() ? '目录' : '文件'}\n大小: ${this.formatSize(stats.size)}`,
          completed: false
        };
      } else {
        return {
          actionId: action.id,
          status: 'success',
          content: `文件不存在: ${filePath}`,
          completed: false
        };
      }
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  private async copyFile(action: ActionStructure, sourcePath: string): Promise<ActionResult> {
    const destPath = action.value || '';
    
    if (!destPath) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: '未指定目标路径',
        completed: false
      };
    }
    
    try {
      // 确保目标目录存在
      const dir = path.dirname(destPath);
      await fs.promises.mkdir(dir, { recursive: true });
      
      await fs.promises.copyFile(sourcePath, destPath);
      
      return {
        actionId: action.id,
        status: 'success',
        content: `复制成功: ${sourcePath} -> ${destPath}`,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `复制失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  private async moveFile(action: ActionStructure, sourcePath: string): Promise<ActionResult> {
    const destPath = action.value || '';
    
    if (!destPath) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: '未指定目标路径',
        completed: false
      };
    }
    
    try {
      // 确保目标目录存在
      const dir = path.dirname(destPath);
      await fs.promises.mkdir(dir, { recursive: true });
      
      await fs.promises.rename(sourcePath, destPath);
      
      return {
        actionId: action.id,
        status: 'success',
        content: `移动成功: ${sourcePath} -> ${destPath}`,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `移动失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  private async createDirectory(action: ActionStructure, dirPath: string): Promise<ActionResult> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      
      return {
        actionId: action.id,
        status: 'success',
        content: `创建目录成功: ${dirPath}`,
        completed: false
      };
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `创建目录失败: ${error instanceof Error ? error.message : '未知错误'}`,
        completed: false
      };
    }
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 工具方法
  // ───────────────────────────────────────────────────────────────────
  
  private resolvePath(targetPath: string): string {
    // 如果是相对路径，相对于 /tmp
    if (!path.isAbsolute(targetPath)) {
      return path.resolve('/tmp', targetPath);
    }
    return targetPath;
  }
  
  private isPathAllowed(targetPath: string): boolean {
    return this.allowedPaths.some(allowed => targetPath.startsWith(allowed));
  }
  
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
