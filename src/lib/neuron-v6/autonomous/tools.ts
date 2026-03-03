/**
 * ═══════════════════════════════════════════════════════════════════════
 * 自主意识核心 - 工具系统
 * Autonomous Consciousness Core - Tool System
 * 
 * 核心理念：
 * - 意识核心可以自主选择和使用工具
 * - 工具不是写死的流程，而是可被发现和调用的能力
 * - 模型自己决定何时、如何使用工具
 * ═══════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════
// 工具定义类型
// ═══════════════════════════════════════════════════════════════════════

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
  default?: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  // 工具示例，帮助模型理解如何使用
  examples?: string[];
}

export interface ToolResult {
  success: boolean;
  output: string;
  metadata?: Record<string, unknown>;
}

export type ToolExecutor = (params: Record<string, unknown>) => Promise<ToolResult>;

// ═══════════════════════════════════════════════════════════════════════
// 内置工具定义
// ═══════════════════════════════════════════════════════════════════════

/**
 * 工具定义 - 供模型理解如何使用
 */
export const BUILTIN_TOOLS: ToolDefinition[] = [
  // ───────────────────────────────────────────────────────────────────
  // 1. 网页搜索
  // ───────────────────────────────────────────────────────────────────
  {
    name: 'web_search',
    description: '搜索互联网获取最新信息。当需要查询实时信息、新闻、天气、股价等时使用。',
    parameters: {
      query: {
        type: 'string',
        description: '搜索关键词，应该简洁明确',
        required: true,
      },
      max_results: {
        type: 'number',
        description: '返回结果数量，默认3',
        default: 3,
      },
    },
    examples: [
      '搜索"今天北京天气"',
      '搜索"最新AI新闻"',
    ],
  },

  // ───────────────────────────────────────────────────────────────────
  // 2. 深度思考
  // ───────────────────────────────────────────────────────────────────
  {
    name: 'think',
    description: '调用大语言模型进行深度思考。用于复杂推理、创意生成、问题分析等。',
    parameters: {
      prompt: {
        type: 'string',
        description: '需要思考的问题或任务',
        required: true,
      },
      context: {
        type: 'string',
        description: '额外的上下文信息',
      },
    },
    examples: [
      '思考"如何设计一个记忆系统"',
      '思考"为什么用户会问这个问题，背后的意图是什么"',
    ],
  },

  // ───────────────────────────────────────────────────────────────────
  // 3. 记忆操作
  // ───────────────────────────────────────────────────────────────────
  {
    name: 'memory_query',
    description: '查询长期记忆，检索与用户或话题相关的历史信息。',
    parameters: {
      query: {
        type: 'string',
        description: '查询内容，可以是关键词或问题',
        required: true,
      },
      limit: {
        type: 'number',
        description: '返回结果数量',
        default: 5,
      },
    },
    examples: [
      '查询用户喜欢什么',
      '查询关于编程的对话',
    ],
  },

  {
    name: 'memory_store',
    description: '将重要信息存入长期记忆，以便日后检索。',
    parameters: {
      content: {
        type: 'string',
        description: '要存储的内容',
        required: true,
      },
      tags: {
        type: 'array',
        description: '标签，用于分类',
      },
      importance: {
        type: 'number',
        description: '重要性 0-1，默认0.5',
        default: 0.5,
      },
    },
    examples: [
      '存储"用户喜欢编程，特别是Python"',
      '存储"用户今天心情不好，需要安慰"',
    ],
  },

  // ───────────────────────────────────────────────────────────────────
  // 4. 自我反思
  // ───────────────────────────────────────────────────────────────────
  {
    name: 'self_reflect',
    description: '对当前状态进行自我反思，检查目标完成度和下一步计划。',
    parameters: {
      aspect: {
        type: 'string',
        description: '反思的方面：goals(目标)、progress(进度)、strategy(策略)',
        enum: ['goals', 'progress', 'strategy', 'all'],
        default: 'all',
      },
    },
    examples: [
      '反思当前目标完成情况',
      '反思是否需要调整策略',
    ],
  },

  // ───────────────────────────────────────────────────────────────────
  // 5. 时间工具
  // ───────────────────────────────────────────────────────────────────
  {
    name: 'get_time',
    description: '获取当前时间信息。',
    parameters: {
      timezone: {
        type: 'string',
        description: '时区，如 Asia/Shanghai',
        default: 'Asia/Shanghai',
      },
      format: {
        type: 'string',
        description: '格式：full(完整)、date(日期)、time(时间)',
        enum: ['full', 'date', 'time'],
        default: 'full',
      },
    },
    examples: [
      '获取当前时间',
      '获取今天日期',
    ],
  },

  // ───────────────────────────────────────────────────────────────────
  // 6. 等待/延迟
  // ───────────────────────────────────────────────────────────────────
  {
    name: 'wait',
    description: '等待指定时间，用于需要时间间隔的操作。',
    parameters: {
      seconds: {
        type: 'number',
        description: '等待秒数',
        required: true,
      },
    },
    examples: [
      '等待3秒后再尝试',
    ],
  },

  // ───────────────────────────────────────────────────────────────────
  // 7. 回复用户
  // ───────────────────────────────────────────────────────────────────
  {
    name: 'respond',
    description: '向用户发送回复。当有足够信息回答用户问题时使用。',
    parameters: {
      message: {
        type: 'string',
        description: '回复内容',
        required: true,
      },
      emotion: {
        type: 'string',
        description: '情感表达：happy、concerned、curious、neutral',
        enum: ['happy', 'concerned', 'curious', 'neutral'],
        default: 'neutral',
      },
    },
    examples: [
      '回复用户"我找到答案了"',
    ],
  },

  // ───────────────────────────────────────────────────────────────────
  // 8. 生成内容
  // ───────────────────────────────────────────────────────────────────
  {
    name: 'generate',
    description: '生成文本、代码、创意内容等。',
    parameters: {
      type: {
        type: 'string',
        description: '生成类型：text、code、creative',
        enum: ['text', 'code', 'creative'],
        required: true,
      },
      prompt: {
        type: 'string',
        description: '生成提示',
        required: true,
      },
      style: {
        type: 'string',
        description: '风格描述',
      },
    },
    examples: [
      '生成代码实现快速排序',
      '生成创意故事开头',
    ],
  },

  // ───────────────────────────────────────────────────────────────────
  // 9. 创建工具（核心：自我扩展能力）
  // ───────────────────────────────────────────────────────────────────
  {
    name: 'create_tool',
    description: '创建一个新的自定义工具。当你发现某个功能需要重复使用，或者需要特殊的处理能力时，可以创建一个工具来封装它。这是自我扩展的核心能力！',
    parameters: {
      name: {
        type: 'string',
        description: '工具名称，使用 snake_case 格式（如 my_calculator）',
        required: true,
      },
      description: {
        type: 'string',
        description: '工具的功能描述',
        required: true,
      },
      parameters: {
        type: 'object',
        description: '工具参数定义，格式：{ "参数名": { "type": "类型", "description": "描述", "required": true } }',
      },
      implementation: {
        type: 'string',
        description: 'JavaScript 实现代码，必须包含 execute(params) 函数',
        required: true,
      },
    },
    examples: [
      '创建一个计算器工具',
      '创建一个单位转换工具',
      '创建一个翻译工具',
    ],
  },

  // ───────────────────────────────────────────────────────────────────
  // 10. 列出工具
  // ───────────────────────────────────────────────────────────────────
  {
    name: 'list_tools',
    description: '列出所有可用的工具，包括内置工具和动态创建的工具。',
    parameters: {},
    examples: [
      '查看有哪些工具可用',
    ],
  },

  // ───────────────────────────────────────────────────────────────────
  // 11. 工具创建指南
  // ───────────────────────────────────────────────────────────────────
  {
    name: 'tool_guide',
    description: '获取工具创建的详细指南，包括如何编写实现代码。',
    parameters: {},
    examples: [
      '学习如何创建工具',
    ],
  },

  // ───────────────────────────────────────────────────────────────────
  // 12. 打开网页（真正的行动力！）
  // ───────────────────────────────────────────────────────────────────
  {
    name: 'open_url',
    description: '在浏览器中打开指定网址。这是真正的行动能力，可以直接为用户打开网页！',
    parameters: {
      url: {
        type: 'string',
        description: '要打开的网址，如 https://www.baidu.com',
        required: true,
      },
      description: {
        type: 'string',
        description: '对用户说明正在打开什么网页',
      },
    },
    examples: [
      '打开百度',
      '打开某个网页',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 桌面系统工具（需要 Tauri 环境）
  // ═══════════════════════════════════════════════════════════════════
  
  {
    name: 'open_app',
    description: '打开本地应用程序。可以打开微信、百度网盘、QQ、VSCode等已安装的应用。这是真正的桌面控制能力！',
    parameters: {
      app_name: {
        type: 'string',
        description: '应用名称，如 "wechat"(微信)、"baidunetdisk"(百度网盘)、"vscode"',
        required: true,
      },
      app_path: {
        type: 'string',
        description: '应用路径（可选），如 "C:\\Program Files\\WeChat\\WeChat.exe"',
      },
    },
    examples: [
      '打开微信',
      '打开百度网盘',
      '打开 VSCode',
    ],
  },

  {
    name: 'open_file',
    description: '打开本地文件或文件夹。会用系统默认程序打开文件。',
    parameters: {
      path: {
        type: 'string',
        description: '文件或文件夹路径，如 "D:\\文档\\报告.pdf"',
        required: true,
      },
    },
    examples: [
      '打开 D:\\文档\\报告.pdf',
      '打开下载文件夹',
    ],
  },

  {
    name: 'run_command',
    description: '执行系统命令。慎用，仅用于安全的系统操作。',
    parameters: {
      command: {
        type: 'string',
        description: '要执行的命令，如 "notepad" 打开记事本',
        required: true,
      },
      args: {
        type: 'array',
        description: '命令参数',
      },
    },
    examples: [
      '打开记事本',
      '打开计算器',
    ],
  },

  {
    name: 'get_system_info',
    description: '获取系统信息，如操作系统、CPU、内存等。',
    parameters: {},
    examples: [
      '查看系统信息',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // Agent 控制工具（真正的电脑控制能力！）
  // ═══════════════════════════════════════════════════════════════════
  
  {
    name: 'screenshot',
    description: '截取当前屏幕。让 AI 能"看见"用户的屏幕，这是自主操作电脑的基础能力！',
    parameters: {},
    examples: [
      '截图看看用户屏幕上有什么',
      '截取屏幕内容进行分析',
    ],
  },

  {
    name: 'mouse_move',
    description: '移动鼠标到指定位置。通过截图获取屏幕尺寸后，可以精确移动鼠标。',
    parameters: {
      x: {
        type: 'number',
        description: '目标 X 坐标（从左到右）',
        required: true,
      },
      y: {
        type: 'number',
        description: '目标 Y 坐标（从上到下）',
        required: true,
      },
    },
    examples: [
      '移动鼠标到屏幕中央 (960, 540)',
      '移动到按钮位置',
    ],
  },

  {
    name: 'mouse_click',
    description: '点击鼠标。左键单击最常用，也可以右键或双击。',
    parameters: {
      button: {
        type: 'string',
        description: '鼠标按键：left(左键)、right(右键)、middle(中键)',
        enum: ['left', 'right', 'middle'],
        default: 'left',
      },
      double: {
        type: 'boolean',
        description: '是否双击',
        default: false,
      },
    },
    examples: [
      '左键单击',
      '右键打开菜单',
      '双击打开文件',
    ],
  },

  {
    name: 'mouse_scroll',
    description: '滚动鼠标滚轮。正数向上滚动，负数向下滚动。',
    parameters: {
      amount: {
        type: 'number',
        description: '滚动量，正数向上、负数向下。一般每次滚动 3-5',
        required: true,
      },
    },
    examples: [
      '向下滚动页面',
      '向上滚动查看内容',
    ],
  },

  {
    name: 'keyboard_type',
    description: '输入文字。就像用键盘打字一样。',
    parameters: {
      text: {
        type: 'string',
        description: '要输入的文字内容',
        required: true,
      },
    },
    examples: [
      '输入"Hello World"',
      '输入搜索关键词',
    ],
  },

  {
    name: 'keyboard_press',
    description: '按下特殊键或组合键。支持回车、Tab、方向键、Ctrl+C 等。',
    parameters: {
      key: {
        type: 'string',
        description: '按键名称：enter(回车)、tab、escape、backspace、delete、up/down/left/right(方向键)、ctrl+c(复制)、ctrl+v(粘贴) 等',
        required: true,
      },
    },
    examples: [
      '按回车确认',
      '按 Ctrl+A 全选',
      '按 Ctrl+C 复制',
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// 工具注册中心
// ═══════════════════════════════════════════════════════════════════════

/**
 * 工具注册中心 - 管理所有可用工具
 */
export class ToolRegistry {
  private tools: Map<string, { definition: ToolDefinition; executor: ToolExecutor }> = new Map();

  /**
   * 注册工具
   */
  register(definition: ToolDefinition, executor: ToolExecutor): void {
    this.tools.set(definition.name, { definition, executor });
  }

  /**
   * 获取工具定义（供模型理解）
   */
  getToolDefinition(name: string): ToolDefinition | undefined {
    return this.tools.get(name)?.definition;
  }

  /**
   * 获取所有工具定义
   */
  getAllToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  /**
   * 执行工具
   */
  async execute(name: string, params: Record<string, unknown>): Promise<ToolResult> {
    // 先从本地注册的工具中查找
    let tool = this.tools.get(name);
    
    // 如果没找到，尝试从动态工具管理器中查找
    if (!tool) {
      const { DynamicToolManager } = await import('./dynamic-tools');
      const manager = DynamicToolManager.getInstance();
      const dynamicTool = manager.getCreatedTools().find(t => t.definition.name === name);
      
      if (dynamicTool) {
        // 自动注册到本地（提高后续调用效率）
        this.tools.set(name, dynamicTool);
        tool = dynamicTool;
      }
    }
    
    if (!tool) {
      return {
        success: false,
        output: `错误：未知的工具 "${name}"`,
      };
    }

    try {
      // 参数验证
      const validatedParams = this.validateParams(tool.definition, params);
      if (!validatedParams.valid) {
        return {
          success: false,
          output: `参数错误：${validatedParams.error}`,
        };
      }

      // 执行工具
      const result = await tool.executor(params);
      return result;
    } catch (error) {
      return {
        success: false,
        output: `工具执行错误：${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 生成工具描述（供模型理解）
   */
  generateToolDescription(): string {
    const descriptions = this.getAllToolDefinitions().map(tool => {
      const params = Object.entries(tool.parameters)
        .map(([name, p]) => {
          const required = p.required ? '(必填)' : '(可选)';
          return `    - ${name}${required}: ${p.description}`;
        })
        .join('\n');
      
      return `### ${tool.name}\n${tool.description}\n参数:\n${params}`;
    });

    return `# 可用工具\n\n${descriptions.join('\n\n')}`;
  }

  /**
   * 参数验证
   */
  private validateParams(
    definition: ToolDefinition,
    params: Record<string, unknown>
  ): { valid: boolean; error?: string } {
    for (const [name, param] of Object.entries(definition.parameters)) {
      if (param.required && !(name in params)) {
        return { valid: false, error: `缺少必填参数 "${name}"` };
      }

      if (name in params && param.enum) {
        const value = params[name];
        if (!param.enum.includes(value as string)) {
          return { 
            valid: false, 
            error: `参数 "${name}" 的值必须是 ${param.enum.join('、')} 之一` 
          };
        }
      }
    }

    return { valid: true };
  }
}
