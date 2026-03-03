/**
 * ═══════════════════════════════════════════════════════════════════════
 * 自主意识核心 - 动态工具系统
 * Autonomous Consciousness Core - Dynamic Tool System
 * 
 * 核心理念：
 * - 模型不仅能使用工具，还能自己创建新工具
 * - 新工具的定义来自模型的推理
 * - 实现真正的"自我扩展"能力
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { ToolDefinition, ToolResult, ToolExecutor } from './tools';

// ─────────────────────────────────────────────────────────────────────
// 动态工具定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 工具创建请求
 */
export interface ToolCreationRequest {
  name: string;
  description: string;
  parameters: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required?: boolean;
  }>;
  implementation: string; // JavaScript 代码字符串
}

/**
 * 动态工具管理器
 */
export class DynamicToolManager {
  private static instance: DynamicToolManager | null = null;
  private createdTools: Map<string, { definition: ToolDefinition; executor: ToolExecutor }> = new Map();
  private creationHistory: Array<{
    toolName: string;
    createdAt: number;
    createdBy: string; // 'model' | 'user'
    reason: string;
  }> = [];

  static getInstance(): DynamicToolManager {
    if (!DynamicToolManager.instance) {
      DynamicToolManager.instance = new DynamicToolManager();
    }
    return DynamicToolManager.instance;
  }

  /**
   * 创建新工具（由模型自主调用）
   */
  async createTool(request: ToolCreationRequest, createdBy: 'model' | 'user' = 'model'): Promise<ToolResult> {
    const { name, description, parameters, implementation } = request;

    // 验证工具名
    if (!name || !/^[a-z_][a-z0-9_]*$/.test(name)) {
      return {
        success: false,
        output: `工具名格式错误：必须是 snake_case 格式，只能包含小写字母、数字和下划线`,
      };
    }

    // 检查是否已存在
    if (this.createdTools.has(name)) {
      return {
        success: false,
        output: `工具 "${name}" 已存在`,
      };
    }

    try {
      // 创建执行器
      const executor = this.createExecutor(implementation);

      // 创建工具定义
      const definition: ToolDefinition = {
        name,
        description,
        parameters,
      };

      // 注册工具
      this.createdTools.set(name, { definition, executor });

      // 记录创建历史
      this.creationHistory.push({
        toolName: name,
        createdAt: Date.now(),
        createdBy,
        reason: description,
      });

      return {
        success: true,
        output: `成功创建工具 "${name}"。\n描述: ${description}\n参数: ${Object.keys(parameters).join(', ') || '无'}`,
        metadata: { toolName: name },
      };
    } catch (error) {
      return {
        success: false,
        output: `创建工具失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 创建执行器（从代码字符串）
   */
  private createExecutor(code: string): ToolExecutor {
    return async (params: Record<string, unknown>): Promise<ToolResult> => {
      try {
        // 安全执行（使用 Function 构造器）
        // 注意：生产环境需要更严格的安全控制
        const fn = new Function('params', 'console', `
          ${code}
          return execute(params);
        `);
        
        const result = await fn(params, console);
        
        return {
          success: true,
          output: String(result),
        };
      } catch (error) {
        return {
          success: false,
          output: `工具执行错误: ${error instanceof Error ? error.message : '未知错误'}`,
        };
      }
    };
  }

  /**
   * 获取所有动态创建的工具
   */
  getCreatedTools(): Array<{ definition: ToolDefinition; executor: ToolExecutor }> {
    return Array.from(this.createdTools.values());
  }

  /**
   * 获取工具定义（供模型理解）
   */
  getToolDefinition(name: string): ToolDefinition | undefined {
    return this.createdTools.get(name)?.definition;
  }

  /**
   * 获取创建历史
   */
  getCreationHistory(): Array<{
    toolName: string;
    createdAt: number;
    createdBy: string;
    reason: string;
  }> {
    return [...this.creationHistory];
  }

  /**
   * 删除工具
   */
  deleteTool(name: string): boolean {
    return this.createdTools.delete(name);
  }

  /**
   * 生成工具创建指南（供模型理解如何创建工具）
   */
  getToolCreationGuide(): string {
    return `
## 创建新工具

你可以通过 \`create_tool\` 工具创建自己的工具！

### 格式
{
  "name": "工具名称（snake_case）",
  "description": "工具描述",
  "parameters": {
    "参数名": {
      "type": "string | number | boolean | array | object",
      "description": "参数描述",
      "required": true/false
    }
  },
  "implementation": "JavaScript 代码，必须有一个 execute(params) 函数"
}

### 示例：创建一个计算器工具
{
  "name": "calculator",
  "description": "执行数学计算",
  "parameters": {
    "expression": {
      "type": "string",
      "description": "数学表达式，如 '123*456'",
      "required": true
    }
  },
  "implementation": "function execute(params) { return eval(params.expression); }"
}

### 注意
- 工具名必须是 snake_case 格式
- implementation 必须包含 execute(params) 函数
- 返回值会自动转为字符串
`;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 内置的"创建工具"工具定义
// ═══════════════════════════════════════════════════════════════════════

export const CREATE_TOOL_DEFINITION: ToolDefinition = {
  name: 'create_tool',
  description: '创建一个新的自定义工具。当你发现需要重复使用的功能时，可以创建一个工具来封装它。',
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
      description: '工具参数定义，JSON 格式',
    },
    implementation: {
      type: 'string',
      description: '工具的 JavaScript 实现代码，必须包含 execute(params) 函数',
      required: true,
    },
  },
  examples: [
    '创建计算器工具',
    '创建单位转换工具',
  ],
};