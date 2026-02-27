/**
 * ═══════════════════════════════════════════════════════════════════════
 * 工具调用意图识别器
 * Tool Call Intent Recognizer
 * 
 * 分析用户输入，识别是否需要调用工具，并规划工具调用
 * 
 * 核心能力：
 * 1. 快速关键词匹配 - 针对明确意图的即时响应
 * 2. 深度 LLM 分析 - 处理复杂模糊的表达
 * 3. 上下文感知 - 基于对话历史推断意图
 * 4. 多步任务规划 - 检测需要多工具协作的复杂任务
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

export interface ConversationContext {
  /** 最近的消息历史 */
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** 最近使用的工具 */
  recentTools: Array<{ name: string; success: boolean; timestamp: number }>;
  /** 当前任务状态 */
  currentTask?: {
    description: string;
    startedAt: number;
    toolsUsed: string[];
  };
}

export interface MultiStepPlan {
  steps: Array<{
    tool: string;
    arguments: Record<string, unknown>;
    description: string;
    dependsOn?: string[];
  }>;
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// ═══════════════════════════════════════════════════════════════════════
// 工具意图识别器
// ═══════════════════════════════════════════════════════════════════════

export class ToolIntentRecognizer {
  private llmClient: LLMClient;
  private toolEngine = getToolEngine(DEFAULT_SECURITY_POLICY);
  private context: ConversationContext = {
    recentMessages: [],
    recentTools: [],
  };

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  /**
   * 更新对话上下文
   */
  updateContext(message: { role: 'user' | 'assistant'; content: string }): void {
    this.context.recentMessages.push(message);
    // 保持最近 10 条消息
    if (this.context.recentMessages.length > 10) {
      this.context.recentMessages.shift();
    }
  }

  /**
   * 记录工具使用
   */
  recordToolUsage(name: string, success: boolean): void {
    this.context.recentTools.push({
      name,
      success,
      timestamp: Date.now(),
    });
    // 保持最近 20 次工具调用
    if (this.context.recentTools.length > 20) {
      this.context.recentTools.shift();
    }
  }

  /**
   * 分析用户输入，识别工具调用意图
   */
  async analyzeIntent(userInput: string): Promise<ToolIntent> {
    // 更新上下文
    this.updateContext({ role: 'user', content: userInput });

    // 检测多步任务
    const multiStepIntent = this.detectMultiStepTask(userInput);
    if (multiStepIntent) {
      return multiStepIntent;
    }

    // 快速关键词匹配 - 如果明确包含工具操作关键词，直接返回
    const quickMatch = this.quickMatchIntent(userInput);
    if (quickMatch) {
      return quickMatch;
    }

    // 上下文感知分析 - 检查是否是对之前工具的后续操作
    const contextIntent = this.analyzeWithContext(userInput);
    if (contextIntent) {
      return contextIntent;
    }

    // 使用 LLM 进行深度意图分析
    return this.deepAnalyzeIntent(userInput);
  }

  /**
   * 检测多步任务
   */
  private detectMultiStepTask(userInput: string): ToolIntent | null {
    const input = userInput.toLowerCase();
    
    // 多步任务关键词模式
    const multiStepPatterns = [
      {
        pattern: /(?:先|首先|开始).*?(?:然后|接着|之后|再)/,
        description: '检测到顺序执行意图',
      },
      {
        pattern: /(?:下载|保存|获取).*?(?:然后|接着|再).*?(?:打开|查看|编辑)/,
        description: '检测到下载后处理意图',
      },
      {
        pattern: /(?:搜索|查找).*?(?:然后|接着|再).*?(?:打开|访问|下载)/,
        description: '检测到搜索后访问意图',
      },
      {
        pattern: /(?:备份|复制).*?(?:然后|接着|再).*?(?:删除|清理)/,
        description: '检测到备份后删除意图',
      },
      {
        pattern: /(?:截图|截屏).*?(?:然后|接着|再).*?(?:发送|保存|分析)/,
        description: '检测到截图后处理意图',
      },
    ];

    for (const { pattern, description } of multiStepPatterns) {
      if (pattern.test(input)) {
        // 返回需要深度分析的标记
        return {
          needsTool: true,
          toolCalls: [],
          confidence: 0.6,
          reasoning: `${description}，需要深度分析具体步骤`,
        };
      }
    }

    return null;
  }

  /**
   * 上下文感知分析
   */
  private analyzeWithContext(userInput: string): ToolIntent | null {
    const input = userInput.toLowerCase();
    const recentTools = this.context.recentTools.slice(-5);

    // 如果用户说"再次"、"再来一次"等，重复最近成功的工具
    if (/(?:再次|再来|重复|又一次|又来)/.test(input)) {
      const lastSuccess = [...recentTools].reverse().find(t => t.success);
      if (lastSuccess) {
        return {
          needsTool: true,
          toolCalls: [{
            name: lastSuccess.name,
            arguments: {},
            reasoning: '用户要求重复上一次成功的操作',
          }],
          confidence: 0.9,
          reasoning: `基于上下文，重复执行工具: ${lastSuccess.name}`,
        };
      }
    }

    // 如果用户说"换个..."、"试试另一个..."，切换相关工具
    if (/(?:换个|试试另一个|换一个|其他的|别的)/.test(input)) {
      // 这里可以根据最近使用的工具类别推荐替代方案
      // 简化处理：交给深度分析
      return null;
    }

    // 如果用户说"打开结果"、"查看结果"，可能是在询问最近工具的输出
    if (/(?:打开结果|查看结果|看看结果|结果是什么)/.test(input)) {
      const lastTool = recentTools[recentTools.length - 1];
      if (lastTool && lastTool.success) {
        // 假设结果中有路径，尝试打开
        return {
          needsTool: true,
          toolCalls: [{
            name: 'fs_read_file',
            arguments: { path: '.' },
            reasoning: '用户想查看最近操作的结果',
          }],
          confidence: 0.7,
          reasoning: '基于上下文，用户想查看最近操作的结果',
        };
      }
    }

    return null;
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
      fetch: ['获取网页', '打开网页', 'fetch', 'get url', '访问网站', '打开网站', '打开百度', '打开谷歌', '打开github', '访问', '看看网站', '浏览网页', '打开链接', '访问链接'],
      search: ['网上搜索', '网络搜索', 'web search', 'google', '搜索一下', '帮我搜索', '搜一下'],
      download: ['下载', 'download'],
    };

    // 本地操作关键词
    const localKeywords = {
      openApp: ['打开应用', '启动应用', '运行程序', '打开软件', '启动', 'open app', 'launch app', '打开微信', '打开qq', '打开vscode', '打开vs code', '打开浏览器'],
      windowList: ['窗口列表', '显示窗口', '列出窗口', '有哪些窗口', 'window list'],
      windowFocus: ['切换窗口', '聚焦窗口', '激活窗口', '转到窗口', 'focus window'],
      screenshot: ['截图', '截屏', '截个图', 'screen capture', 'screenshot', '抓屏'],
      notify: ['通知我', '提醒我', '发通知', 'notify', 'remind'],
      type: ['输入文字', '键盘输入', '打字', 'type text', 'auto type'],
      click: ['点击', '鼠标点击', 'click', 'mouse click'],
      hotkey: ['快捷键', '按下', '按键', 'hotkey', 'press key', '复制', '粘贴', 'ctrl+c', 'ctrl+v', 'alt+tab'],
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
              name: 'web_open',
              arguments: { url },
              reasoning: `检测到打开网页意图: "${keyword}"`,
            }],
            confidence: 0.85,
            reasoning: '用户想要打开网页',
          };
        }
      }
    }

    // 打开应用
    for (const keyword of localKeywords.openApp) {
      if (input.includes(keyword)) {
        const appName = this.extractAppName(userInput);
        return {
          needsTool: true,
          toolCalls: [{
            name: 'app_launch',
            arguments: { name: appName },
            reasoning: `检测到启动应用意图: "${keyword}"`,
          }],
          confidence: 0.85,
          reasoning: '用户想要启动应用程序',
        };
      }
    }

    // 截图
    for (const keyword of localKeywords.screenshot) {
      if (input.includes(keyword)) {
        return {
          needsTool: true,
          toolCalls: [{
            name: 'screen_capture',
            arguments: {},
            reasoning: `检测到截图意图: "${keyword}"`,
          }],
          confidence: 0.9,
          reasoning: '用户想要截取屏幕',
        };
      }
    }

    // 快捷键
    for (const keyword of localKeywords.hotkey) {
      if (input.includes(keyword)) {
        const keys = this.extractHotkey(userInput, keyword);
        return {
          needsTool: true,
          toolCalls: [{
            name: 'auto_hotkey',
            arguments: { keys },
            reasoning: `检测到快捷键意图: "${keyword}"`,
          }],
          confidence: 0.85,
          reasoning: '用户想要按下快捷键',
        };
      }
    }

    // 发送通知
    for (const keyword of localKeywords.notify) {
      if (input.includes(keyword)) {
        const message = userInput.replace(new RegExp(`${keyword}|通知我|提醒我|发通知`, 'gi'), '').trim();
        return {
          needsTool: true,
          toolCalls: [{
            name: 'sys_notify',
            arguments: { title: '提醒', message: message || '这是您的提醒' },
            reasoning: `检测到通知意图: "${keyword}"`,
          }],
          confidence: 0.85,
          reasoning: '用户想要发送通知',
        };
      }
    }

    return null;
  }

  /**
   * 深度分析 - 使用 LLM 进行复杂意图识别
   */
  private async deepAnalyzeIntent(userInput: string): Promise<ToolIntent> {
    // 构建上下文信息
    const contextInfo = this.buildContextInfo();

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

${contextInfo}

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

如果需要多步操作，按顺序返回多个工具调用。

如果不需要工具，返回：
{
  "needsTool": false,
  "confidence": 0.0-1.0,
  "reasoning": "为什么不需要工具"
}

重要原则：
1. 只在明确需要时才调用工具
2. 普通对话、问候、闲聊不需要工具
3. 如果需要执行多个步骤，按依赖顺序返回多个工具调用
4. 根据用户描述智能推断参数
5. 如果是上下文相关的请求（如"再次"、"再来"），优先使用最近成功的工具
6. 注意安全性，避免执行危险操作`;

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
        const result = JSON.parse(jsonMatch[0]);
        
        // 验证工具名称的有效性
        if (result.toolCalls && Array.isArray(result.toolCalls)) {
          result.toolCalls = result.toolCalls.filter((call: { name: string }) => 
            ALL_TOOLS.some(t => t.name === call.name)
          );
          
          // 如果过滤后没有有效工具，标记为不需要工具
          if (result.toolCalls.length === 0) {
            result.needsTool = false;
            result.reasoning = '无法识别有效的工具调用';
          }
        }
        
        return result;
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
   * 构建上下文信息字符串
   */
  private buildContextInfo(): string {
    const parts: string[] = [];

    // 添加最近消息
    if (this.context.recentMessages.length > 0) {
      parts.push('最近的对话:');
      this.context.recentMessages.slice(-5).forEach((msg, i) => {
        parts.push(`  ${i + 1}. ${msg.role === 'user' ? '用户' : '助手'}: ${msg.content.slice(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
      });
    }

    // 添加最近使用的工具
    if (this.context.recentTools.length > 0) {
      parts.push('\\n最近使用的工具:');
      this.context.recentTools.slice(-5).forEach((tool, i) => {
        parts.push(`  ${i + 1}. ${tool.name} (${tool.success ? '成功' : '失败'})`);
      });
    }

    return parts.length > 0 ? parts.join('\n') : '';
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

        // 记录工具使用
        this.recordToolUsage(call.name, result.success);

        results.push({
          toolName: call.name,
          success: result.success,
          output: result.output,
          error: result.error,
        });
      } catch (error) {
        // 记录失败的调用
        this.recordToolUsage(call.name, false);

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
    // 首先尝试匹配完整 URL
    const urlMatch = input.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) return urlMatch[1];
    
    // 根据关键词推断网站
    const siteMap: Record<string, string> = {
      '百度': 'https://www.baidu.com',
      '谷歌': 'https://www.google.com',
      'google': 'https://www.google.com',
      'github': 'https://github.com',
      'youtube': 'https://www.youtube.com',
      '油管': 'https://www.youtube.com',
      'bilibili': 'https://www.bilibili.com',
      'b站': 'https://www.bilibili.com',
      '知乎': 'https://www.zhihu.com',
      '微博': 'https://weibo.com',
      '淘宝': 'https://www.taobao.com',
      '京东': 'https://www.jd.com',
      '天猫': 'https://www.tmall.com',
      '腾讯': 'https://www.qq.com',
      '微信': 'https://weixin.qq.com',
      '抖音': 'https://www.douyin.com',
      'twitter': 'https://twitter.com',
      '推特': 'https://twitter.com',
      'facebook': 'https://www.facebook.com',
      '脸书': 'https://www.facebook.com',
      'instagram': 'https://www.instagram.com',
      'linkedin': 'https://www.linkedin.com',
      'reddit': 'https://www.reddit.com',
      '亚马逊': 'https://www.amazon.com',
      'amazon': 'https://www.amazon.com',
      '微软': 'https://www.microsoft.com',
      'microsoft': 'https://www.microsoft.com',
      '苹果': 'https://www.apple.com',
      'apple': 'https://www.apple.com',
      'stackoverflow': 'https://stackoverflow.com',
      'csdn': 'https://www.csdn.net',
      '掘金': 'https://juejin.cn',
      'npm': 'https://www.npmjs.com',
      'mdn': 'https://developer.mozilla.org',
    };
    
    const lowerInput = input.toLowerCase();
    for (const [keyword, url] of Object.entries(siteMap)) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        return url;
      }
    }
    
    return null;
  }

  /**
   * 从输入中提取应用名称
   */
  private extractAppName(input: string): string {
    // 常见应用映射
    const appMap: Record<string, string> = {
      '微信': 'WeChat',
      'qq': 'QQ',
      'vscode': 'Code',
      'vs code': 'Code',
      '浏览器': 'Browser',
      'chrome': 'Google Chrome',
      'edge': 'Microsoft Edge',
      'firefox': 'Firefox',
      '记事本': 'Notepad',
      '计算器': 'Calculator',
      '画图': 'Paint',
      '终端': 'Terminal',
      '命令行': 'Command Prompt',
      '资源管理器': 'Explorer',
      '设置': 'Settings',
      '控制面板': 'Control Panel',
    };

    const lowerInput = input.toLowerCase();
    for (const [keyword, appName] of Object.entries(appMap)) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        return appName;
      }
    }

    // 尝试提取引号内的内容
    const quotedMatch = input.match(/['"「」『』【】]([^'"「」『』【】]+)['"「」『』【】]/);
    if (quotedMatch) return quotedMatch[1];

    // 尝试提取 "打开" 后面的内容
    const openMatch = input.match(/(?:打开|启动|运行)\s*(.+?)(?:\s|$|，|。)/);
    if (openMatch) return openMatch[1].trim();

    return '';
  }

  /**
   * 从输入中提取快捷键
   */
  private extractHotkey(input: string, keyword: string): string {
    // 常见快捷键映射
    const hotkeyMap: Record<string, string> = {
      '复制': 'Ctrl+C',
      '粘贴': 'Ctrl+V',
      '剪切': 'Ctrl+X',
      '撤销': 'Ctrl+Z',
      '重做': 'Ctrl+Y',
      '全选': 'Ctrl+A',
      '保存': 'Ctrl+S',
      '查找': 'Ctrl+F',
      '关闭': 'Ctrl+W',
      '切换窗口': 'Alt+Tab',
      '任务管理器': 'Ctrl+Shift+Escape',
      '截图': 'Win+Shift+S',
      '锁屏': 'Win+L',
      '运行': 'Win+R',
    };

    // 检查是否匹配已知快捷键
    for (const [action, hotkey] of Object.entries(hotkeyMap)) {
      if (input.includes(action)) {
        return hotkey;
      }
    }

    // 尝试提取输入中的快捷键格式（如 Ctrl+C, Alt+Tab）
    const hotkeyMatch = input.match(/((?:Ctrl|Alt|Shift|Win|Cmd|Command)\s*[+]\s*\w+)/i);
    if (hotkeyMatch) {
      return hotkeyMatch[1].replace(/\s/g, '');
    }

    // 如果关键词本身就是快捷键格式
    if (/^(Ctrl|Alt|Shift|Win|Cmd)/i.test(keyword)) {
      return keyword;
    }

    return 'Alt+Tab'; // 默认返回切换窗口
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出工厂函数
// ═══════════════════════════════════════════════════════════════════════

export function createToolIntentRecognizer(llmClient: LLMClient): ToolIntentRecognizer {
  return new ToolIntentRecognizer(llmClient);
}
