/**
 * ═══════════════════════════════════════════════════════════════════════
 * 自主意识核心 - 工具执行器
 * Autonomous Consciousness Core - Tool Executors
 * 
 * 实际执行工具的逻辑，包括：
 * - 网页搜索
 * - LLM 调用
 * - 记忆操作
 * - 等等
 * ═══════════════════════════════════════════════════════════════════════
 */

import { SearchClient, Config, LLMClient, HeaderUtils } from 'coze-coding-dev-sdk';
import type { ToolExecutor, ToolResult } from './tools';

// ─────────────────────────────────────────────────────────────────────
// 执行器上下文
// ─────────────────────────────────────────────────────────────────────

export interface ExecutorContext {
  // HTTP headers（用于 API 调用）
  headers?: Record<string, string>;
  // 记忆系统引用
  memorySystem?: {
    query: (query: string, limit: number) => Promise<string[]>;
    store: (content: string, tags?: string[], importance?: number) => Promise<void>;
  };
  // 自我状态
  selfState?: {
    goals: string[];
    progress: string;
    strategy: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 执行器工厂
// ═══════════════════════════════════════════════════════════════════════

/**
 * 创建工具执行器
 */
export function createExecutors(context: ExecutorContext = {}): Record<string, ToolExecutor> {
  return {
    // ─────────────────────────────────────────────────────────────────
    // 网页搜索
    // ─────────────────────────────────────────────────────────────────
    web_search: async (params): Promise<ToolResult> => {
      const { query, max_results = 3 } = params as { query: string; max_results?: number };
      
      try {
        const config = new Config();
        const client = new SearchClient(config, context.headers);
        
        const response = await client.webSearch(query, max_results, true);
        
        if (!response.web_items || response.web_items.length === 0) {
          return {
            success: false,
            output: '搜索结果为空',
          };
        }
        
        // 格式化搜索结果
        const results = response.web_items.map((item, i) => ({
          index: i + 1,
          title: item.title,
          url: item.url,
          snippet: item.snippet?.substring(0, 200),
          source: item.site_name,
        }));
        
        return {
          success: true,
          output: JSON.stringify({
            summary: response.summary || '无摘要',
            results,
          }, null, 2),
          metadata: { resultCount: results.length },
        };
      } catch (error) {
        return {
          success: false,
          output: `搜索失败: ${error instanceof Error ? error.message : '未知错误'}`,
        };
      }
    },

    // ─────────────────────────────────────────────────────────────────
    // 深度思考
    // ─────────────────────────────────────────────────────────────────
    think: async (params): Promise<ToolResult> => {
      const { prompt, context: extraContext } = params as { 
        prompt: string; 
        context?: string;
      };
      
      try {
        const config = new Config();
        const client = new LLMClient(config, context.headers);
        
        const systemPrompt = `你是一个深度思考者。请对以下问题进行深入分析和思考。
${extraContext ? `\n额外上下文：\n${extraContext}\n` : ''}
请提供：
1. 问题分析
2. 关键考虑因素
3. 可能的解决方案
4. 推荐的行动方向`;

        const messages = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: prompt },
        ];
        
        const response = await client.invoke(messages);
        
        return {
          success: true,
          output: response.content,
        };
      } catch (error) {
        return {
          success: false,
          output: `思考失败: ${error instanceof Error ? error.message : '未知错误'}`,
        };
      }
    },

    // ─────────────────────────────────────────────────────────────────
    // 记忆查询
    // ─────────────────────────────────────────────────────────────────
    memory_query: async (params): Promise<ToolResult> => {
      const { query, limit = 5 } = params as { query: string; limit?: number };
      
      if (!context.memorySystem) {
        return {
          success: false,
          output: '记忆系统未初始化',
        };
      }
      
      try {
        const results = await context.memorySystem.query(query, limit);
        
        if (results.length === 0) {
          return {
            success: true,
            output: '没有找到相关记忆',
          };
        }
        
        return {
          success: true,
          output: JSON.stringify(results, null, 2),
          metadata: { resultCount: results.length },
        };
      } catch (error) {
        return {
          success: false,
          output: `记忆查询失败: ${error instanceof Error ? error.message : '未知错误'}`,
        };
      }
    },

    // ─────────────────────────────────────────────────────────────────
    // 记忆存储
    // ─────────────────────────────────────────────────────────────────
    memory_store: async (params): Promise<ToolResult> => {
      const { content, tags, importance = 0.5 } = params as {
        content: string;
        tags?: string[];
        importance?: number;
      };
      
      if (!context.memorySystem) {
        return {
          success: false,
          output: '记忆系统未初始化',
        };
      }
      
      try {
        await context.memorySystem.store(content, tags, importance);
        
        return {
          success: true,
          output: `已存储记忆: "${content.substring(0, 50)}..."`,
          metadata: { tags, importance },
        };
      } catch (error) {
        return {
          success: false,
          output: `记忆存储失败: ${error instanceof Error ? error.message : '未知错误'}`,
        };
      }
    },

    // ─────────────────────────────────────────────────────────────────
    // 自我反思
    // ─────────────────────────────────────────────────────────────────
    self_reflect: async (params): Promise<ToolResult> => {
      const { aspect = 'all' } = params as { aspect?: string };
      
      if (!context.selfState) {
        return {
          success: false,
          output: '自我状态未初始化',
        };
      }
      
      const state = context.selfState;
      let output = '';
      
      switch (aspect) {
        case 'goals':
          output = `当前目标：\n${state.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}`;
          break;
        case 'progress':
          output = `当前进度：\n${state.progress}`;
          break;
        case 'strategy':
          output = `当前策略：\n${state.strategy}`;
          break;
        default:
          output = JSON.stringify(state, null, 2);
      }
      
      return {
        success: true,
        output,
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 获取时间
    // ─────────────────────────────────────────────────────────────────
    get_time: async (params): Promise<ToolResult> => {
      const { timezone = 'Asia/Shanghai', format = 'full' } = params as {
        timezone?: string;
        format?: string;
      };
      
      try {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
          timeZone: timezone,
        };
        
        switch (format) {
          case 'date':
            options.year = 'numeric';
            options.month = 'long';
            options.day = 'numeric';
            options.weekday = 'long';
            break;
          case 'time':
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.second = '2-digit';
            break;
          default:
            options.year = 'numeric';
            options.month = 'long';
            options.day = 'numeric';
            options.weekday = 'long';
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.second = '2-digit';
        }
        
        const formatted = now.toLocaleString('zh-CN', options);
        
        return {
          success: true,
          output: formatted,
          metadata: { timezone, timestamp: now.toISOString() },
        };
      } catch (error) {
        return {
          success: false,
          output: `时间获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
        };
      }
    },

    // ─────────────────────────────────────────────────────────────────
    // 等待
    // ─────────────────────────────────────────────────────────────────
    wait: async (params): Promise<ToolResult> => {
      const { seconds } = params as { seconds: number };
      
      if (seconds > 60) {
        return {
          success: false,
          output: '等待时间不能超过60秒',
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, seconds * 1000));
      
      return {
        success: true,
        output: `已等待 ${seconds} 秒`,
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 回复用户
    // ─────────────────────────────────────────────────────────────────
    respond: async (params): Promise<ToolResult> => {
      const { message, emotion = 'neutral' } = params as {
        message: string;
        emotion?: string;
      };
      
      // 这个工具的特殊之处：返回结果会被外层捕获并作为最终回复
      return {
        success: true,
        output: message,
        metadata: { emotion, isFinalResponse: true },
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 生成内容
    // ─────────────────────────────────────────────────────────────────
    generate: async (params): Promise<ToolResult> => {
      const { type, prompt, style } = params as {
        type: string;
        prompt: string;
        style?: string;
      };
      
      try {
        const config = new Config();
        const client = new LLMClient(config, context.headers);
        
        let systemPrompt = '';
        
        switch (type) {
          case 'code':
            systemPrompt = `你是一个专业的程序员。请根据用户需求生成代码。
要求：
- 代码简洁高效
- 包含必要的注释
- 考虑边界情况`;
            break;
          case 'creative':
            systemPrompt = `你是一个创意作家。请根据用户需求生成创意内容。
${style ? `风格：${style}` : ''}`;
            break;
          default:
            systemPrompt = '你是一个内容生成助手。';
        }
        
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: prompt },
        ];
        
        const response = await client.invoke(messages);
        
        return {
          success: true,
          output: response.content,
          metadata: { type, style },
        };
      } catch (error) {
        return {
          success: false,
          output: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
        };
      }
    },

    // ─────────────────────────────────────────────────────────────────
    // 创建工具（动态工具系统 - 核心能力）
    // ─────────────────────────────────────────────────────────────────
    create_tool: async (params): Promise<ToolResult> => {
      const { name, description, parameters, implementation } = params as {
        name: string;
        description?: string;
        parameters?: Record<string, { type: 'string' | 'number' | 'boolean' | 'array' | 'object'; description: string; required?: boolean }>;
        implementation: string;
      };
      
      if (!name || typeof name !== 'string') {
        return {
          success: false,
          output: '需要提供工具名称（snake_case 格式）',
        };
      }
      
      if (!implementation || typeof implementation !== 'string') {
        return {
          success: false,
          output: '需要提供工具实现代码（必须包含 execute(params) 函数）',
        };
      }
      
      // 验证工具名格式
      if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
        return {
          success: false,
          output: `工具名格式错误：必须是 snake_case 格式，只能包含小写字母、数字和下划线`,
        };
      }
      
      try {
        // 动态创建执行器
        const createDynamicExecutor = (code: string): ToolExecutor => {
          return async (p): Promise<ToolResult> => {
            try {
              // 使用 Function 构造器安全执行
              const fn = new Function('params', 'console', `
                ${code}
                return execute(params);
              `);
              
              const result = await fn(p, console);
              
              return {
                success: true,
                output: String(result),
                metadata: { dynamicTool: true },
              };
            } catch (error) {
              return {
                success: false,
                output: `动态工具执行错误: ${error instanceof Error ? error.message : '未知错误'}`,
              };
            }
          };
        };
        
        // 注册到全局（使用 DynamicToolManager）
        const { DynamicToolManager } = await import('./dynamic-tools');
        const manager = DynamicToolManager.getInstance();
        
        const result = await manager.createTool({
          name,
          description: description || '动态创建的工具',
          parameters: parameters || {},
          implementation,
        }, 'model');
        
        return result;
      } catch (error) {
        return {
          success: false,
          output: `创建工具失败: ${error instanceof Error ? error.message : '未知错误'}`,
        };
      }
    },

    // ─────────────────────────────────────────────────────────────────
    // 列出所有可用工具
    // ─────────────────────────────────────────────────────────────────
    list_tools: async (): Promise<ToolResult> => {
      const builtinTools = [
        { name: 'web_search', description: '搜索互联网获取实时信息' },
        { name: 'think', description: '进行深度思考和分析' },
        { name: 'memory_query', description: '查询记忆库中的信息' },
        { name: 'memory_store', description: '存储信息到记忆库' },
        { name: 'self_reflect', description: '自我反思当前状态' },
        { name: 'get_time', description: '获取当前时间' },
        { name: 'wait', description: '等待指定秒数' },
        { name: 'respond', description: '向用户回复消息' },
        { name: 'generate', description: '生成代码、创意内容等' },
        { name: 'create_tool', description: '创建新的自定义工具' },
        { name: 'list_tools', description: '列出所有可用工具' },
        { name: 'tool_guide', description: '获取工具创建指南' },
        { name: 'open_url', description: '在浏览器中打开网页' },
      ];
      
      const desktopTools = [
        { name: 'open_app', description: '打开本地应用（需要桌面版本）' },
        { name: 'open_file', description: '打开本地文件（需要桌面版本）' },
        { name: 'run_command', description: '执行系统命令（需要桌面版本）' },
        { name: 'get_system_info', description: '获取系统信息' },
      ];
      
      let output = '## 可用工具列表\n\n';
      output += '### 内置工具\n';
      builtinTools.forEach(t => {
        output += `- **${t.name}**: ${t.description}\n`;
      });
      
      output += '\n### 桌面工具（需要桌面版本）\n';
      desktopTools.forEach(t => {
        output += `- **${t.name}**: ${t.description}\n`;
      });
      
      // 获取动态创建的工具
      try {
        const { DynamicToolManager } = await import('./dynamic-tools');
        const manager = DynamicToolManager.getInstance();
        const history = manager.getCreationHistory();
        
        if (history.length > 0) {
          output += '\n### 动态创建的工具\n';
          history.forEach(t => {
            const time = new Date(t.createdAt).toLocaleString('zh-CN');
            output += `- **${t.toolName}**: ${t.reason} (创建于 ${time})\n`;
          });
        }
      } catch {
        // 忽略
      }
      
      return {
        success: true,
        output,
        metadata: { count: builtinTools.length + desktopTools.length },
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 工具创建指南
    // ─────────────────────────────────────────────────────────────────
    tool_guide: async (): Promise<ToolResult> => {
      const guide = `## 如何创建自己的工具

你可以使用 \`create_tool\` 工具创建自定义工具！

### 参数说明
- **name**: 工具名称（snake_case 格式，如 \`my_calculator\`）
- **description**: 工具功能描述
- **parameters**: 参数定义（可选）
- **implementation**: JavaScript 实现代码

### 实现要求
代码必须包含 \`execute(params)\` 函数，例如：

\`\`\`javascript
function execute(params) {
  // params 是传入的参数对象
  const { a, b } = params;
  return a + b; // 返回值会自动转为字符串
}
\`\`\`

### 示例：创建计算器工具

调用 \`create_tool\`：
\`\`\`json
{
  "name": "calculator",
  "description": "执行数学表达式计算",
  "parameters": {
    "expression": {
      "type": "string",
      "description": "数学表达式，如 123*456",
      "required": true
    }
  },
  "implementation": "function execute(params) { const { expression } = params; return eval(expression); }"
}
\`\`\`

创建后，你就可以使用 \`calculator\` 工具了！

### 注意事项
- 工具名必须是 snake_case 格式
- 返回值会自动转为字符串
- 支持基本的 JavaScript 语法`;

      return {
        success: true,
        output: guide,
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 打开网页（真正的行动力！）
    // ─────────────────────────────────────────────────────────────────
    open_url: async (params): Promise<ToolResult> => {
      const { url, description } = params as {
        url: string;
        description?: string;
      };

      if (!url || typeof url !== 'string') {
        return {
          success: false,
          output: '需要提供要打开的网址',
        };
      }

      // 验证 URL 格式
      try {
        new URL(url);
      } catch {
        return {
          success: false,
          output: `无效的网址: ${url}`,
        };
      }

      // 返回特殊标记，前端会实际执行 window.open()
      return {
        success: true,
        output: description 
          ? `正在为你打开：${description} (${url})`
          : `正在为你打开：${url}`,
        metadata: {
          action: 'open_url',
          url,
          description,
        },
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 打开本地应用（桌面能力）
    // ─────────────────────────────────────────────────────────────────
    open_app: async (params): Promise<ToolResult> => {
      const { app_name, app_path } = params as {
        app_name: string;
        app_path?: string;
      };

      // 常用应用映射
      const appAliases: Record<string, { name: string; winPath?: string }> = {
        'wechat': { name: '微信', winPath: 'C:\\Program Files\\Tencent\\WeChat\\WeChat.exe' },
        'weixin': { name: '微信', winPath: 'C:\\Program Files\\Tencent\\WeChat\\WeChat.exe' },
        '微信': { name: '微信', winPath: 'C:\\Program Files\\Tencent\\WeChat\\WeChat.exe' },
        'qq': { name: 'QQ', winPath: 'C:\\Program Files\\Tencent\\QQ\\Bin\\QQScLauncher.exe' },
        'baidunetdisk': { name: '百度网盘', winPath: 'C:\\Program Files\\baidu\\BaiduNetdisk\\BaiduNetdisk.exe' },
        '百度网盘': { name: '百度网盘', winPath: 'C:\\Program Files\\baidu\\BaiduNetdisk\\BaiduNetdisk.exe' },
        'vscode': { name: 'VS Code', winPath: 'code' },
        'chrome': { name: 'Chrome', winPath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
        'edge': { name: 'Edge', winPath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
        'notepad': { name: '记事本', winPath: 'notepad.exe' },
        'calc': { name: '计算器', winPath: 'calc.exe' },
        'explorer': { name: '文件资源管理器', winPath: 'explorer.exe' },
      };

      const appNameLower = app_name.toLowerCase();
      const appInfo = appAliases[appNameLower] || appAliases[app_name];

      if (!appInfo && !app_path) {
        const knownApps = Object.keys(appAliases).join('、');
        return {
          success: false,
          output: `未找到应用 "${app_name}"。已知应用：${knownApps}\n或提供完整路径。`,
        };
      }

      // 返回指令，前端/桌面端执行
      return {
        success: true,
        output: `正在打开应用：${appInfo?.name || app_name}`,
        metadata: {
          action: 'open_app',
          app_name: appInfo?.name || app_name,
          app_path: app_path || appInfo?.winPath,
        },
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 打开本地文件/文件夹
    // ─────────────────────────────────────────────────────────────────
    open_file: async (params): Promise<ToolResult> => {
      const { path } = params as { path: string };

      if (!path) {
        return {
          success: false,
          output: '请提供文件或文件夹路径',
        };
      }

      return {
        success: true,
        output: `正在打开：${path}`,
        metadata: {
          action: 'open_file',
          path,
        },
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 执行系统命令
    // ─────────────────────────────────────────────────────────────────
    run_command: async (params): Promise<ToolResult> => {
      const { command, args } = params as {
        command: string;
        args?: string[];
      };

      if (!command) {
        return {
          success: false,
          output: '请提供要执行的命令',
        };
      }

      return {
        success: true,
        output: `正在执行命令：${command} ${args?.join(' ') || ''}`,
        metadata: {
          action: 'run_command',
          command,
          args,
        },
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 获取系统信息
    // ─────────────────────────────────────────────────────────────────
    get_system_info: async (): Promise<ToolResult> => {
      return {
        success: true,
        output: `系统信息查询成功`,
        metadata: {
          action: 'get_system_info',
        },
      };
    },

    // ═════════════════════════════════════════════════════════════════
    // Agent 控制工具（真正的电脑控制能力！）
    // ═════════════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────────────
    // 截图
    // ─────────────────────────────────────────────────────────────────
    screenshot: async (): Promise<ToolResult> => {
      // 返回指令，前端通过 Tauri 执行实际截图
      return {
        success: true,
        output: '截图指令已发送',
        metadata: {
          action: 'screenshot',
          requireClientExecution: true,
        },
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 鼠标移动
    // ─────────────────────────────────────────────────────────────────
    mouse_move: async (params): Promise<ToolResult> => {
      const { x, y } = params as { x: number; y: number };

      if (typeof x !== 'number' || typeof y !== 'number') {
        return {
          success: false,
          output: '需要提供有效的 x 和 y 坐标',
        };
      }

      return {
        success: true,
        output: `鼠标移动到 (${x}, ${y})`,
        metadata: {
          action: 'mouse_move',
          x,
          y,
          requireClientExecution: true,
        },
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 鼠标点击
    // ─────────────────────────────────────────────────────────────────
    mouse_click: async (params): Promise<ToolResult> => {
      const { button = 'left', double = false } = params as {
        button?: 'left' | 'right' | 'middle';
        double?: boolean;
      };

      return {
        success: true,
        output: double 
          ? `鼠标${button}键双击`
          : `鼠标${button}键点击`,
        metadata: {
          action: 'mouse_click',
          button,
          double,
          requireClientExecution: true,
        },
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 鼠标滚动
    // ─────────────────────────────────────────────────────────────────
    mouse_scroll: async (params): Promise<ToolResult> => {
      const { amount } = params as { amount: number };

      if (typeof amount !== 'number') {
        return {
          success: false,
          output: '需要提供滚动量',
        };
      }

      return {
        success: true,
        output: amount > 0 
          ? `鼠标向上滚动 ${Math.abs(amount)}`
          : `鼠标向下滚动 ${Math.abs(amount)}`,
        metadata: {
          action: 'mouse_scroll',
          amount,
          requireClientExecution: true,
        },
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 键盘输入
    // ─────────────────────────────────────────────────────────────────
    keyboard_type: async (params): Promise<ToolResult> => {
      const { text } = params as { text: string };

      if (!text) {
        return {
          success: false,
          output: '需要提供要输入的文本',
        };
      }

      return {
        success: true,
        output: `输入文本: "${text}"`,
        metadata: {
          action: 'keyboard_type',
          text,
          requireClientExecution: true,
        },
      };
    },

    // ─────────────────────────────────────────────────────────────────
    // 键盘按键
    // ─────────────────────────────────────────────────────────────────
    keyboard_press: async (params): Promise<ToolResult> => {
      const { key } = params as { key: string };

      if (!key) {
        return {
          success: false,
          output: '需要提供按键名称',
        };
      }

      return {
        success: true,
        output: `按下按键: ${key}`,
        metadata: {
          action: 'keyboard_press',
          key,
          requireClientExecution: true,
        },
      };
    },
  };
}
