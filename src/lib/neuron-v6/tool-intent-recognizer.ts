/**
 * ═══════════════════════════════════════════════════════════════════════
 * 工具调用意图识别器
 * Tool Call Intent Recognizer
 * 
 * 分析用户输入，识别是否需要调用工具，并规划工具调用
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import { ALL_TOOLS, getToolEngine, DEFAULT_SECURITY_POLICY } from '@/lib/tools';
import type { ToolResult } from '@/lib/tools/types';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

export interface ToolIntent {
  /** 是否需要工具调用 */
  needsTool: boolean;
  /** 识别到的工具调用 */
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
    reasoning: string;
  }>;
  /** 置信度 0-1 */
  confidence: number;
  /** 推理过程 */
  reasoning: string;
}

export interface ToolExecutionResult {
  success: boolean;
  results: Array<{
    toolName: string;
    success: boolean;
    output?: unknown;
    error?: string;
  }>;
  summary: string;
}

// ═══════════════════════════════════════════════════════════════════════
// 工具意图识别器
// ═══════════════════════════════════════════════════════════════════════

export class ToolIntentRecognizer {
  private llmClient: LLMClient;
  private toolEngine = getToolEngine(DEFAULT_SECURITY_POLICY);

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  /**
   * 分析用户输入，识别工具调用意图
   */
  async analyzeIntent(userInput: string): Promise<ToolIntent> {
    // 快速关键词匹配 - 如果明确包含工具操作关键词，直接返回
    const quickMatch = this.quickMatchIntent(userInput);
    if (quickMatch) {
      return quickMatch;
    }

    // 使用 LLM 进行深度意图分析
    return this.deepAnalyzeIntent(userInput);
  }

  /**
   * 快速匹配 - 基于关键词的快速识别
   */
  private quickMatchIntent(userInput: string): ToolIntent | null {
    const input = userInput.toLowerCase();
    
    // 文件操作关键词
    const fileKeywords = {
      read: ['读取', '查看文件', '打开文件', '读一下', 'read file', 'show file'],
      list: ['列出', '目录', '文件夹', 'list', 'ls', 'dir', '看看目录', '看看当前目录', '目录有什么', '目录里有什么', '显示目录', '查看目录'],
      write: ['写入', '保存', '创建文件', 'write', 'save', 'create file'],
      delete: ['删除', '移除', 'delete', 'remove', 'rm'],
      search: ['搜索', '查找', 'find', 'search', 'grep'],
    };

    // 系统操作关键词
    const systemKeywords = {
      info: ['系统信息', '系统状态', 'cpu', '内存', '磁盘', 'system info', 'system status'],
      process: ['进程', '运行中', 'process', 'running'],
      execute: ['执行命令', '运行命令', 'execute', 'run command', '终端'],
    };

    // 代码执行关键词
    const codeKeywords = {
      python: ['运行python', '执行python', 'python代码', 'run python', 'python'],
      javascript: ['运行js', '执行javascript', 'js代码', 'run js', 'javascript'],
      shell: ['运行脚本', '执行脚本', 'shell', 'bash', 'script'],
    };

    // 网络操作关键词
    const webKeywords = {
      fetch: ['获取网页', '打开网页', 'fetch', 'get url', '访问网站'],
      search: ['网上搜索', '网络搜索', 'web search', 'google', '搜索一下'],
      download: ['下载', 'download'],
    };

    // 检查是否匹配
    // 文件操作
    for (const keyword of fileKeywords.read) {
      if (input.includes(keyword)) {
        return {
          needsTool: true,
          toolCalls: [{
            name: 'fs_read_file',
            arguments: { path: this.extractPath(userInput) || '.' },
            reasoning: `检测到文件读取意图: "${keyword}"`,
          }],
          confidence: 0.8,
          reasoning: '用户想要读取文件内容',
        };
      }
    }

    for (const keyword of fileKeywords.list) {
      if (input.includes(keyword)) {
        return {
          needsTool: true,
          toolCalls: [{
            name: 'fs_list_directory',
            arguments: { path: this.extractPath(userInput) || '.' },
            reasoning: `检测到目录列出意图: "${keyword}"`,
          }],
          confidence: 0.85,
          reasoning: '用户想要查看目录内容',
        };
      }
    }

    // 系统信息
    for (const keyword of systemKeywords.info) {
      if (input.includes(keyword)) {
        return {
          needsTool: true,
          toolCalls: [{
            name: 'sys_info',
            arguments: {},
            reasoning: `检测到系统信息查询意图: "${keyword}"`,
          }],
          confidence: 0.9,
          reasoning: '用户想要了解系统状态',
        };
      }
    }

    // 进程列表
    for (const keyword of systemKeywords.process) {
      if (input.includes(keyword)) {
        return {
          needsTool: true,
          toolCalls: [{
            name: 'sys_processes',
            arguments: {},
            reasoning: `检测到进程查询意图: "${keyword}"`,
          }],
          confidence: 0.85,
          reasoning: '用户想要查看运行的进程',
        };
      }
    }

    // Python 执行
    for (const keyword of codeKeywords.python) {
      if (input.includes(keyword)) {
        const code = this.extractCode(userInput);
        if (code) {
          return {
            needsTool: true,
            toolCalls: [{
              name: 'code_run_python',
              arguments: { code },
              reasoning: `检测到Python执行意图: "${keyword}"`,
            }],
            confidence: 0.9,
            reasoning: '用户想要运行Python代码',
          };
        }
      }
    }

    // 网络搜索
    for (const keyword of webKeywords.search) {
      if (input.includes(keyword)) {
        const query = this.extractSearchQuery(userInput);
        return {
          needsTool: true,
          toolCalls: [{
            name: 'web_search',
            arguments: { query },
            reasoning: `检测到网络搜索意图: "${keyword}"`,
          }],
          confidence: 0.85,
          reasoning: '用户想要在网上搜索信息',
        };
      }
    }

    // 网页获取
    for (const keyword of webKeywords.fetch) {
      if (input.includes(keyword)) {
        const url = this.extractUrl(userInput);
        if (url) {
          return {
            needsTool: true,
            toolCalls: [{
              name: 'web_fetch',
              arguments: { url },
              reasoning: `检测到网页获取意图: "${keyword}"`,
            }],
            confidence: 0.85,
            reasoning: '用户想要获取网页内容',
          };
        }
      }
    }

    return null;
  }

  /**
   * 深度分析 - 使用 LLM 进行复杂意图识别
   */
  private async deepAnalyzeIntent(userInput: string): Promise<ToolIntent> {
    const systemPrompt = `你是一个意图识别器，分析用户输入是否需要调用工具来完成任务。

可用的工具类别：
1. 文件系统 (fs_*): 读取、写入、搜索、列表、复制、移动、删除文件
2. 系统信息 (sys_*): 获取系统信息、进程列表、环境变量、执行命令
3. 代码执行 (code_*): 运行 Python、JavaScript、Shell 脚本
4. 网络操作 (web_*): 获取网页、搜索、下载文件
5. 屏幕操作 (screen_*): 截屏、分析屏幕
6. 应用控制 (app_*): 启动应用、切换窗口
7. 自动化 (auto_*): 键盘输入、鼠标点击、快捷键

工具列表：
${ALL_TOOLS.map(t => `- ${t.name}: ${t.displayName} - ${t.description}`).join('\n')}

分析用户输入，判断是否需要调用工具。返回 JSON 格式：
{
  "needsTool": true/false,
  "toolCalls": [
    {
      "name": "工具名称",
      "arguments": { 参数 },
      "reasoning": "为什么选择这个工具"
    }
  ],
  "confidence": 0.0-1.0,
  "reasoning": "整体推理过程"
}

如果不需要工具，返回：
{
  "needsTool": false,
  "confidence": 0.0-1.0,
  "reasoning": "为什么不需要工具"
}

注意：
- 只在明确需要时才调用工具
- 普通对话、问候、闲聊不需要工具
- 如果需要执行多个步骤，可以返回多个工具调用
- 根据用户描述智能推断参数`;

    try {
      const response = await this.llmClient.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ], {
        temperature: 0.1,
      });

      const content = typeof response === 'string' ? response : (response as { content?: string }).content || '';
      
      // 提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        needsTool: false,
        confidence: 0.5,
        reasoning: '无法解析意图分析结果',
      };
    } catch (error) {
      console.error('[ToolIntentRecognizer] 深度分析失败:', error);
      return {
        needsTool: false,
        confidence: 0,
        reasoning: '意图分析失败',
      };
    }
  }

  /**
   * 执行工具调用
   */
  async executeTools(
    toolCalls: Array<{ name: string; arguments: Record<string, unknown> }>,
    context?: { sessionId?: string; conversationId?: string; headers?: Record<string, string> }
  ): Promise<ToolExecutionResult> {
    const results: ToolExecutionResult['results'] = [];

    for (const call of toolCalls) {
      try {
        const result = await this.toolEngine.execute({
          id: `tool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: call.name,
          arguments: call.arguments,
          source: 'ai',
          conversationId: context?.conversationId,
          timestamp: Date.now(),
        }, {
          workingDirectory: process.cwd(),
          sessionId: context?.sessionId,
          headers: context?.headers,
        });

        results.push({
          toolName: call.name,
          success: result.success,
          output: result.output,
          error: result.error,
        });
      } catch (error) {
        results.push({
          toolName: call.name,
          success: false,
          error: error instanceof Error ? error.message : '执行失败',
        });
      }
    }

    // 生成摘要
    const successCount = results.filter(r => r.success).length;
    const summary = successCount === results.length
      ? `所有 ${results.length} 个工具执行成功`
      : `${successCount}/${results.length} 个工具执行成功`;

    return {
      success: successCount > 0,
      results,
      summary,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 辅助方法
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 从输入中提取路径
   */
  private extractPath(input: string): string | null {
    // 匹配引号内的路径
    const quotedMatch = input.match(/['"]([^'"]+)['"]/);
    if (quotedMatch) return quotedMatch[1];

    // 匹配路径格式
    const pathMatch = input.match(/(?:path|路径|文件|目录)[:\s]+([^\s,，。]+)/i);
    if (pathMatch) return pathMatch[1];

    // 匹配以 / 或 ./ 或 ../ 开头的路径
    const absolutePath = input.match(/(\/[\w\-./]+)/);
    if (absolutePath) return absolutePath[1];

    const relativePath = input.match(/(\.\/[\w\-./]+)/);
    if (relativePath) return relativePath[1];

    return null;
  }

  /**
   * 从输入中提取代码
   */
  private extractCode(input: string): string | null {
    // 匹配代码块
    const codeBlockMatch = input.match(/```(?:python)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) return codeBlockMatch[1].trim();

    // 匹配引号内的代码
    const quotedMatch = input.match(/['"`]([^'"`]+)['"`]/);
    if (quotedMatch) return quotedMatch[1];

    return null;
  }

  /**
   * 从输入中提取搜索查询
   */
  private extractSearchQuery(input: string): string {
    // 移除触发词
    const cleaned = input
      .replace(/网上搜索|网络搜索|搜索一下|搜索|search|google/gi, '')
      .replace(/['"""]/g, '')
      .trim();
    
    return cleaned || input;
  }

  /**
   * 从输入中提取 URL
   */
  private extractUrl(input: string): string | null {
    const urlMatch = input.match(/(https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[1] : null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出工厂函数
// ═══════════════════════════════════════════════════════════════════════

export function createToolIntentRecognizer(llmClient: LLMClient): ToolIntentRecognizer {
  return new ToolIntentRecognizer(llmClient);
}
