/**
 * ═══════════════════════════════════════════════════════════════════════
 * 网络工具执行器
 * Web Tool Executor
 * 
 * 实现网页获取、搜索、下载等功能
 * ═══════════════════════════════════════════════════════════════════════
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import type { ToolExecutor, ToolResult, ExecutionContext } from '../types';

const execAsync = promisify(exec);
const writeFile = promisify(fs.writeFile);

// ─────────────────────────────────────────────────────────────────────
// 网络工具执行器
// ─────────────────────────────────────────────────────────────────────

export function createWebExecutor(): ToolExecutor {
  return {
    definition: {
      name: 'web',
      displayName: '网络操作',
      description: '网页获取、搜索、下载',
      category: 'web',
      dangerLevel: 'safe',
      requiresConfirmation: false,
      timeout: 30000,
      parameters: [],
    },

    async execute(params: Record<string, unknown>, context: ExecutionContext): Promise<ToolResult> {
      const startTime = Date.now();
      const toolName = params._toolName as string;

      try {
        switch (toolName) {
          case 'web_fetch':
            return await handleFetch(params, context, startTime);
          case 'web_search':
            return await handleSearch(params, startTime);
          case 'web_download':
            return await handleDownload(params, context, startTime);
          default:
            return {
              callId: '',
              toolName: toolName || 'unknown',
              success: false,
              error: `未知的网络工具: ${toolName}`,
              duration: Date.now() - startTime,
              timestamp: Date.now(),
            };
        }
      } catch (error) {
        return {
          callId: '',
          toolName: toolName || 'web',
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
// 网页获取
// ─────────────────────────────────────────────────────────────────────

async function handleFetch(
  params: Record<string, unknown>,
  _context: ExecutionContext,
  startTime: number
): Promise<ToolResult> {
  const url = params.url as string;
  const format = (params.format as string) || 'text';
  
  // 使用 curl 获取网页
  try {
    const { stdout } = await execAsync(`curl -sL -A "Mozilla/5.0" "${url}"`, {
      timeout: 30000,
      maxBuffer: 5 * 1024 * 1024, // 5MB
    });

    let content = stdout;
    
    // 简单的 HTML 到文本转换
    if (format === 'text' || format === 'markdown') {
      // 移除脚本和样式
      content = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');
      
      // 提取标题
      const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      if (format === 'markdown') {
        // 简单的 Markdown 转换
        content = content
          .replace(/<h1[^>]*>([^<]*)<\/h1>/gi, '# $1\n\n')
          .replace(/<h2[^>]*>([^<]*)<\/h2>/gi, '## $1\n\n')
          .replace(/<h3[^>]*>([^<]*)<\/h3>/gi, '### $1\n\n')
          .replace(/<h4[^>]*>([^<]*)<\/h4>/gi, '#### $1\n\n')
          .replace(/<p[^>]*>([^<]*)<\/p>/gi, '$1\n\n')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '[$2]($1)')
          .replace(/<strong[^>]*>([^<]*)<\/strong>/gi, '**$1**')
          .replace(/<b[^>]*>([^<]*)<\/b>/gi, '**$1**')
          .replace(/<em[^>]*>([^<]*)<\/em>/gi, '*$1*')
          .replace(/<i[^>]*>([^<]*)<\/i>/gi, '*$1*')
          .replace(/<code[^>]*>([^<]*)<\/code>/gi, '`$1`')
          .replace(/<li[^>]*>([^<]*)<\/li>/gi, '- $1\n')
          .replace(/<[^>]+>/g, '') // 移除其他标签
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        if (title) {
          content = `# ${title}\n\n${content}`;
        }
      } else {
        // 纯文本：移除所有标签
        content = content
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    return {
      callId: '',
      toolName: 'web_fetch',
      success: true,
      output: {
        url,
        title: format === 'markdown' ? content.split('\n')[0].replace('# ', '') : undefined,
        content: content.substring(0, 50000), // 限制长度
        format,
        size: content.length,
      },
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      callId: '',
      toolName: 'web_fetch',
      success: false,
      error: `获取网页失败: ${error instanceof Error ? error.message : '未知错误'}`,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 网络搜索
// ─────────────────────────────────────────────────────────────────────

async function handleSearch(
  params: Record<string, unknown>,
  startTime: number
): Promise<ToolResult> {
  const query = params.query as string;
  const numResults = (params.num_results as number) || 5;

  // 使用 DuckDuckGo 的 HTML 版本进行搜索（无需 API）
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  try {
    const { stdout } = await execAsync(`curl -sL -A "Mozilla/5.0" "${searchUrl}"`, {
      timeout: 15000,
    });

    // 解析搜索结果
    const results: Array<{
      title: string;
      url: string;
      snippet: string;
    }> = [];

    // 简单的正则提取（实际应用中应使用更健壮的解析器）
    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*)<\/a>/g;
    
    let match;
    const urls: string[] = [];
    const titles: string[] = [];
    const snippets: string[] = [];
    
    while ((match = resultRegex.exec(stdout)) !== null && titles.length < numResults) {
      const url = match[1];
      const title = match[2].trim();
      
      // 过滤广告和无效链接
      if (url && !url.includes('duckduckgo.com') && title) {
        urls.push(url);
        titles.push(title);
      }
    }
    
    while ((match = snippetRegex.exec(stdout)) !== null && snippets.length < numResults) {
      snippets.push(match[1].trim());
    }

    for (let i = 0; i < Math.min(titles.length, numResults); i++) {
      results.push({
        title: titles[i],
        url: urls[i] || '',
        snippet: snippets[i] || '',
      });
    }

    return {
      callId: '',
      toolName: 'web_search',
      success: true,
      output: {
        query,
        results,
        total: results.length,
      },
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      callId: '',
      toolName: 'web_search',
      success: false,
      error: `搜索失败: ${error instanceof Error ? error.message : '未知错误'}`,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 文件下载
// ─────────────────────────────────────────────────────────────────────

async function handleDownload(
  params: Record<string, unknown>,
  context: ExecutionContext,
  startTime: number
): Promise<ToolResult> {
  const url = params.url as string;
  const destination = params.destination as string;
  const filename = params.filename as string | undefined;

  // 确定文件名
  let finalFilename = filename;
  if (!finalFilename) {
    const urlPath = new URL(url).pathname;
    finalFilename = path.basename(urlPath) || `download_${Date.now()}`;
  }

  const filePath = path.resolve(context.workingDirectory, destination, finalFilename);

  try {
    // 使用 curl 下载
    await execAsync(`curl -sL -o "${filePath}" "${url}"`, {
      timeout: 300000, // 5分钟
    });

    // 检查文件是否存在
    const stats = await fs.promises.stat(filePath);

    return {
      callId: '',
      toolName: 'web_download',
      success: true,
      output: {
        url,
        path: filePath,
        filename: finalFilename,
        size: stats.size,
        sizeFormatted: formatSize(stats.size),
      },
      duration: Date.now() - startTime,
      timestamp: Date.now(),
      generatedFiles: [{
        path: filePath,
        name: finalFilename,
        size: stats.size,
        mimeType: getMimeType(finalFilename),
      }],
    };
  } catch (error) {
    return {
      callId: '',
      toolName: 'web_download',
      success: false,
      error: `下载失败: ${error instanceof Error ? error.message : '未知错误'}`,
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

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.html': 'text/html',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
