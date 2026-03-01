/**
 * ═══════════════════════════════════════════════════════════════════════
 * Agent 执行器核心
 * Agent Executor Core
 * 
 * 核心能力：
 * 1. 工具定义和注册
 * 2. 意图识别和工具选择
 * 3. 任务分解和执行
 * 4. 结果聚合和反馈
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

/** 工具参数定义 */
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: string[];
}

/** 工具定义 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  category?: string;
  dangerous?: boolean;
  requiresConfirmation?: boolean;
}

/** 工具调用请求 */
export interface ToolCallRequest {
  toolName: string;
  arguments: Record<string, unknown>;
  reasoning?: string;
}

/** 工具执行结果 */
export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

/** Agent执行步骤 */
export interface AgentStep {
  id: string;
  type: 'think' | 'tool_call' | 'observation' | 'conclusion';
  content: string;
  toolCall?: ToolCallRequest;
  toolResult?: ToolResult;
  timestamp: number;
}

/** Agent执行结果 */
export interface AgentExecutionResult {
  success: boolean;
  answer: string;
  steps: AgentStep[];
  toolsUsed: string[];
  duration: number;
  confidence: number;
}

/** Agent配置 */
export interface AgentConfig {
  llmClient: LLMClient;
  maxSteps?: number;
  timeout?: number;
  enableToolChain?: boolean;
  onStep?: (step: AgentStep) => void;
}

// ═══════════════════════════════════════════════════════════════════════
// 基础工具定义
// ═══════════════════════════════════════════════════════════════════════

/** 内置工具列表 */
export const BUILT_IN_TOOLS: ToolDefinition[] = [
  // 文件系统工具
  {
    name: 'read_file',
    description: '读取文件内容',
    category: 'filesystem',
    parameters: [
      { name: 'path', type: 'string', description: '文件路径', required: true }
    ]
  },
  {
    name: 'write_file',
    description: '写入文件内容',
    category: 'filesystem',
    dangerous: true,
    requiresConfirmation: true,
    parameters: [
      { name: 'path', type: 'string', description: '文件路径', required: true },
      { name: 'content', type: 'string', description: '文件内容', required: true }
    ]
  },
  {
    name: 'list_directory',
    description: '列出目录内容',
    category: 'filesystem',
    parameters: [
      { name: 'path', type: 'string', description: '目录路径', required: true }
    ]
  },
  
  // Web工具
  {
    name: 'web_search',
    description: '搜索互联网获取信息',
    category: 'web',
    parameters: [
      { name: 'query', type: 'string', description: '搜索关键词', required: true },
      { name: 'limit', type: 'number', description: '结果数量', default: 5 }
    ]
  },
  {
    name: 'web_fetch',
    description: '获取网页内容',
    category: 'web',
    parameters: [
      { name: 'url', type: 'string', description: '网页URL', required: true }
    ]
  },
  
  // 代码工具
  {
    name: 'execute_code',
    description: '执行代码片段',
    category: 'code',
    dangerous: true,
    requiresConfirmation: true,
    parameters: [
      { name: 'language', type: 'string', description: '编程语言', enum: ['javascript', 'python', 'bash'], required: true },
      { name: 'code', type: 'string', description: '代码内容', required: true }
    ]
  },
  
  // 系统工具
  {
    name: 'get_system_info',
    description: '获取系统信息',
    category: 'system',
    parameters: []
  },
  {
    name: 'get_current_time',
    description: '获取当前时间',
    category: 'system',
    parameters: [
      { name: 'timezone', type: 'string', description: '时区', default: 'UTC' }
    ]
  }
];

// ═══════════════════════════════════════════════════════════════════════
// 工具注册表
// ═══════════════════════════════════════════════════════════════════════

type ToolExecutor = (args: Record<string, unknown>) => Promise<ToolResult>;

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private executors: Map<string, ToolExecutor> = new Map();

  constructor() {
    // 注册内置工具定义
    BUILT_IN_TOOLS.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
  }

  register(tool: ToolDefinition, executor: ToolExecutor): void {
    this.tools.set(tool.name, tool);
    this.executors.set(tool.name, executor);
  }

  getDefinition(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getExecutor(name: string): ToolExecutor | undefined {
    return this.executors.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolsByCategory(): Record<string, ToolDefinition[]> {
    const result: Record<string, ToolDefinition[]> = {};
    this.tools.forEach(tool => {
      const category = tool.category || 'general';
      if (!result[category]) result[category] = [];
      result[category].push(tool);
    });
    return result;
  }
}

export const toolRegistry = new ToolRegistry();

// ═══════════════════════════════════════════════════════════════════════
// Agent执行器
// ═══════════════════════════════════════════════════════════════════════

export class AgentExecutor {
  private config: AgentConfig;
  private steps: AgentStep[] = [];
  private toolsUsed: string[] = [];

  constructor(config: AgentConfig) {
    this.config = {
      maxSteps: 10,
      timeout: 60000,
      enableToolChain: true,
      ...config
    };
  }

  /**
   * 执行用户请求
   */
  async execute(userInput: string): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    this.steps = [];
    this.toolsUsed = [];

    try {
      // 第一步：理解和规划
      await this.think(userInput);

      // 迭代执行工具调用直到完成
      let iteration = 0;
      while (iteration < this.config.maxSteps!) {
        const shouldContinue = await this.executeStep(userInput);
        if (!shouldContinue) break;
        iteration++;
      }

      // 生成最终答案
      const answer = await this.generateAnswer(userInput);

      return {
        success: true,
        answer,
        steps: this.steps,
        toolsUsed: this.toolsUsed,
        duration: Date.now() - startTime,
        confidence: this.calculateConfidence()
      };
    } catch (error) {
      return {
        success: false,
        answer: `执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        steps: this.steps,
        toolsUsed: this.toolsUsed,
        duration: Date.now() - startTime,
        confidence: 0
      };
    }
  }

  /**
   * 思考步骤
   */
  private async think(input: string): Promise<void> {
    const step: AgentStep = {
      id: `think_${Date.now()}`,
      type: 'think',
      content: `分析用户请求: "${input}"`,
      timestamp: Date.now()
    };

    this.steps.push(step);
    this.config.onStep?.(step);
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(_context: string): Promise<boolean> {
    // 使用LLM决定下一步行动
    const decision = await this.decideNextAction();
    
    if (decision.type === 'finish') {
      return false;
    }

    if (decision.type === 'tool_call' && decision.toolCall) {
      await this.executeToolCall(decision.toolCall);
      return this.config.enableToolChain!;
    }

    return false;
  }

  /**
   * 决定下一步行动
   */
  private async decideNextAction(): Promise<{ type: 'tool_call' | 'finish'; toolCall?: ToolCallRequest }> {
    // 简化实现：基于当前状态决定
    // 完整实现将使用LLM进行决策
    const lastStep = this.steps[this.steps.length - 1];
    
    // 如果已经执行过工具，暂时结束
    if (this.toolsUsed.length > 0) {
      return { type: 'finish' };
    }

    // 默认：不调用工具，直接完成
    return { type: 'finish' };
  }

  /**
   * 执行工具调用
   */
  private async executeToolCall(request: ToolCallRequest): Promise<void> {
    const stepId = `tool_${Date.now()}`;
    
    // 记录工具调用
    const callStep: AgentStep = {
      id: stepId,
      type: 'tool_call',
      content: `调用工具: ${request.toolName}`,
      toolCall: request,
      timestamp: Date.now()
    };
    this.steps.push(callStep);
    this.config.onStep?.(callStep);

    // 执行工具
    const executor = toolRegistry.getExecutor(request.toolName);
    let result: ToolResult;

    if (executor) {
      result = await executor(request.arguments);
    } else {
      result = {
        success: false,
        error: `工具 "${request.toolName}" 未实现`
      };
    }

    // 记录结果
    const resultStep: AgentStep = {
      id: `result_${Date.now()}`,
      type: 'observation',
      content: result.success ? '执行成功' : `执行失败: ${result.error}`,
      toolResult: result,
      timestamp: Date.now()
    };
    this.steps.push(resultStep);
    this.config.onStep?.(resultStep);

    this.toolsUsed.push(request.toolName);
  }

  /**
   * 生成最终答案
   */
  private async generateAnswer(_input: string): Promise<string> {
    const step: AgentStep = {
      id: `conclusion_${Date.now()}`,
      type: 'conclusion',
      content: 'Agent执行完成',
      timestamp: Date.now()
    };
    this.steps.push(step);
    this.config.onStep?.(step);

    // 简化实现：返回摘要
    if (this.toolsUsed.length === 0) {
      return '我理解了您的请求，但当前没有需要执行的工具操作。如需执行具体操作，请告诉我具体需要做什么。';
    }

    return `已完成 ${this.toolsUsed.length} 个工具操作: ${this.toolsUsed.join(', ')}`;
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(): number {
    if (this.toolsUsed.length === 0) return 0.5;
    
    const successSteps = this.steps.filter(s => 
      s.toolResult?.success === true
    ).length;
    
    return Math.min(1, successSteps / Math.max(1, this.toolsUsed.length));
  }
}

/**
 * 创建Agent执行器实例
 */
export function createAgentExecutor(config: AgentConfig): AgentExecutor {
  return new AgentExecutor(config);
}
