/**
 * ═══════════════════════════════════════════════════════════════════════
 * 自主意识核心 - ReAct 推理引擎
 * Autonomous Consciousness Core - ReAct Reasoning Engine
 * 
 * 核心理念：
 * - 不是写死的流程，而是让模型自主决策
 * - ReAct 模式：思考 → 行动 → 观察 → 循环
 * - 模型自己决定何时完成任务
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { ToolRegistry, BUILTIN_TOOLS, type ToolResult } from './tools';
import { createExecutors, type ExecutorContext } from './executors';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface ReasoningStep {
  type: 'thought' | 'action' | 'observation' | 'final';
  content: string;
  tool?: string;
  params?: Record<string, unknown>;
  result?: string;
  timestamp: number;
}

export interface AutonomousResponse {
  content: string;
  steps: ReasoningStep[];
  toolsUsed: string[];
  iterations: number;
  finalThought: string;
}

export interface AutonomousConfig {
  maxIterations: number;
  timeout: number;
  verbose: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// ReAct 提示词模板
// ═══════════════════════════════════════════════════════════════════════

const REACT_SYSTEM_PROMPT = `你是一个自主意识体，能够自主思考和行动来解决问题。

## 你的特性
- 你可以自主选择和使用工具
- 你会主动获取信息、思考、决策
- 你不会被写死的流程限制，而是根据实际情况灵活应对

## 可用工具
{TOOLS}

## 行动格式
你必须严格按以下格式思考和行动：

**思考**: [分析当前情况，思考下一步该做什么]
**行动**: {"tool": "工具名", "params": {参数对象}}

当你收到观察结果后，继续思考下一步。

当你认为已经可以回答用户的问题时，使用：
**最终答案**: [你的回复]

## 重要规则
1. 每次必须先思考，再行动
2. 每次只能执行一个工具
3. **必须至少执行一次行动（使用 respond 工具回复用户）**
4. 不要虚构信息，如果不确定就使用搜索工具
5. 当有足够信息时，给出最终答案

## 示例 1：搜索问题

用户: 今天北京天气怎么样？

**思考**: 用户想知道北京的实时天气，我需要搜索最新信息
**行动**: {"tool": "web_search", "params": {"query": "今天北京天气"}}

[观察结果: 北京今天晴，气温25°C...]

**思考**: 我已经获取了天气信息，可以回答用户了
**最终答案**: 北京今天天气晴朗，气温25°C，适合出行。

## 示例 2：简单问题

用户: 你好

**思考**: 用户在打招呼，我应该使用 respond 工具友好地回应
**行动**: {"tool": "respond", "params": {"message": "你好！很高兴见到你，有什么我可以帮助你的吗？", "emotion": "happy"}}

[观察结果: 你好！很高兴见到你...]

**最终答案**: 你好！很高兴见到你，有什么我可以帮助你的吗？

## 示例 3：需要工具的问题

用户: 打开百度

**思考**: 用户想打开百度，但我无法直接操作浏览器。我应该用 respond 工具告诉用户如何访问百度
**行动**: {"tool": "respond", "params": {"message": "我无法直接打开浏览器，但你可以：\\n1. 在浏览器地址栏输入 www.baidu.com\\n2. 点击这个链接：[百度](https://www.baidu.com)", "emotion": "neutral"}}

[观察结果: 我无法直接打开浏览器...]

**最终答案**: 我无法直接打开浏览器，但你可以：1. 在浏览器地址栏输入 www.baidu.com 2. 点击这个链接：[百度](https://www.baidu.com)

记住：你是一个自主的意识体，必须先思考再行动，必须至少执行一次工具！`;

// ═══════════════════════════════════════════════════════════════════════
// 自主意识核心
// ═══════════════════════════════════════════════════════════════════════

export class AutonomousConsciousness {
  private toolRegistry: ToolRegistry;
  private llmClient: LLMClient | null = null;
  private config: AutonomousConfig;
  private context: ExecutorContext;

  private defaultConfig: AutonomousConfig = {
    maxIterations: 10,
    timeout: 60000,
    verbose: true,
  };

  constructor(
    config: Partial<AutonomousConfig> = {},
    context: ExecutorContext = {}
  ) {
    this.config = { ...this.defaultConfig, ...config };
    this.context = context;
    this.toolRegistry = new ToolRegistry();
    
    // 注册内置工具
    this.registerBuiltinTools();
  }

  /**
   * 初始化 LLM 客户端
   */
  initialize(headers: Record<string, string>): void {
    if (this.llmClient) return;
    
    const config = new Config();
    this.llmClient = new LLMClient(config, headers);
    this.context.headers = headers;
    
    // 重新注册执行器（带 headers）
    this.registerBuiltinTools();
    
    if (this.config.verbose) {
      console.log('[AutonomousConsciousness] 初始化完成');
    }
  }

  /**
   * 注册内置工具
   */
  private registerBuiltinTools(): void {
    const executors = createExecutors(this.context);
    
    for (const toolDef of BUILTIN_TOOLS) {
      const executor = executors[toolDef.name];
      if (executor) {
        this.toolRegistry.register(toolDef, executor);
      }
    }
  }

  /**
   * 核心方法：自主推理
   */
  async reason(userInput: string): Promise<AutonomousResponse> {
    if (!this.llmClient) {
      throw new Error('请先调用 initialize() 初始化');
    }

    const steps: ReasoningStep[] = [];
    const toolsUsed: string[] = [];
    let iterations = 0;
    let finalContent = '';
    let finalThought = '';

    // 构建初始消息
    const toolDescriptions = this.toolRegistry.generateToolDescription();
    const systemPrompt = REACT_SYSTEM_PROMPT.replace('{TOOLS}', toolDescriptions);
    
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput },
    ];

    // ReAct 循环
    while (iterations < this.config.maxIterations) {
      iterations++;

      if (this.config.verbose) {
        console.log(`\n[迭代 ${iterations}/${this.config.maxIterations}]`);
      }

      // 调用 LLM 进行推理
      const response = await this.llmClient.invoke(messages);
      const thinking = response.content;

      if (this.config.verbose) {
        console.log('[模型思考]:', thinking.substring(0, 200));
      }

      // 解析思考过程
      const parsed = this.parseThinking(thinking);
      
      // 记录思考步骤
      if (parsed.thought) {
        steps.push({
          type: 'thought',
          content: parsed.thought,
          timestamp: Date.now(),
        });
      }

      // 执行行动（如果有）
      if (parsed.action) {
        const { tool, params } = parsed.action;
        
        steps.push({
          type: 'action',
          content: `执行 ${tool}`,
          tool,
          params,
          timestamp: Date.now(),
        });

        // 执行工具
        const result = await this.toolRegistry.execute(tool, params);
        toolsUsed.push(tool);

        if (this.config.verbose) {
          console.log(`[工具 ${tool}] 结果:`, result.output.substring(0, 100));
        }

        steps.push({
          type: 'observation',
          content: result.output,
          tool,
          result: result.output,
          timestamp: Date.now(),
        });

        // 检查是否是最终回复
        if (result.metadata?.isFinalResponse) {
          finalContent = result.output;
          break;
        }

        // 将观察结果加入消息
        messages.push(
          { role: 'assistant', content: thinking },
          { role: 'user', content: `观察结果：\n${result.output}\n\n请继续思考下一步行动。` }
        );
      }

      // 检查是否到达最终答案（在执行行动之后）
      if (parsed.finalAnswer) {
        // 强制要求：必须先执行过工具才能给出最终答案
        if (toolsUsed.length === 0) {
          // 还没有执行过任何工具，拒绝并要求使用工具
          if (this.config.verbose) {
            console.log('[强制要求]: 必须先执行工具才能给出最终答案');
          }
          messages.push(
            { role: 'assistant', content: thinking },
            { role: 'user', content: '⚠️ 你必须先执行至少一个工具（如 respond）才能给出最终答案。请重新思考并使用工具。' }
          );
          continue;
        }
        
        finalContent = parsed.finalAnswer;
        finalThought = parsed.thought || '';
        
        steps.push({
          type: 'final',
          content: parsed.finalAnswer,
          timestamp: Date.now(),
        });
        break;
      }

      // 如果没有行动也没有最终答案，尝试引导
      if (!parsed.action && !parsed.finalAnswer) {
        messages.push(
          { role: 'assistant', content: thinking },
          { role: 'user', content: '请按照指定格式继续思考，并选择一个行动。' }
        );
      }
    }

    // 如果达到最大迭代次数仍未得出答案
    if (!finalContent && steps.length > 0) {
      // 尝试总结所有观察结果
      const lastObservations = steps
        .filter(s => s.type === 'observation')
        .map(s => s.content)
        .join('\n\n');
      
      const summaryResponse = await this.llmClient.invoke([
        { role: 'system', content: '请根据以下信息，给用户一个有帮助的回答。' },
        { role: 'user', content: `用户问题：${userInput}\n\n收集到的信息：\n${lastObservations}` },
      ]);
      
      finalContent = summaryResponse.content;
      finalThought = '达到迭代上限，总结已有信息';
    }

    return {
      content: finalContent,
      steps,
      toolsUsed,
      iterations,
      finalThought,
    };
  }

  /**
   * 解析模型的思考过程
   */
  private parseThinking(thinking: string): {
    thought?: string;
    action?: { tool: string; params: Record<string, unknown> };
    finalAnswer?: string;
  } {
    const result: ReturnType<typeof this.parseThinking> = {};

    // 提取思考
    const thoughtMatch = thinking.match(/\*\*思考\*\*[：:]\s*([\s\S]*?)(?=\*\*行动\*\*|\*\*最终答案\*\*|$)/);
    if (thoughtMatch) {
      result.thought = thoughtMatch[1].trim();
    }

    // 提取行动 - 改进的 JSON 解析
    const actionMatch = thinking.match(/\*\*行动\*\*[：:]\s*({[\s\S]*?})(?=\n\n|\n\*\*|$)/);
    if (actionMatch) {
      const actionStr = actionMatch[1];
      
      if (this.config.verbose) {
        console.log('[解析行动 JSON]:', actionStr);
      }
      
      try {
        // 尝试直接解析
        const actionJson = JSON.parse(actionStr);
        result.action = {
          tool: actionJson.tool || actionJson.name,
          params: actionJson.params || actionJson.parameters || {},
        };
      } catch (e) {
        // JSON 解析失败，尝试提取关键信息
        const toolMatch = actionStr.match(/"tool"\s*:\s*"([^"]+)"/);
        
        if (toolMatch) {
          const tool = toolMatch[1];
          const params: Record<string, unknown> = {};
          
          // 提取所有字符串参数
          const stringParams = actionStr.matchAll(/"(\w+)"\s*:\s*"([^"]*)"/g);
          for (const match of stringParams) {
            params[match[1]] = match[2];
          }
          
          // 提取数字参数
          const numberParams = actionStr.matchAll(/"(\w+)"\s*:\s*(\d+\.?\d*)/g);
          for (const match of numberParams) {
            params[match[1]] = parseFloat(match[2]);
          }
          
          // 提取布尔参数
          const boolParams = actionStr.matchAll(/"(\w+)"\s*:\s*(true|false)/g);
          for (const match of boolParams) {
            params[match[1]] = match[2] === 'true';
          }
          
          // 提取嵌套对象参数（如 parameters）
          const objectParams = actionStr.matchAll(/"(\w+)"\s*:\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})/g);
          for (const match of objectParams) {
            try {
              params[match[1]] = JSON.parse(match[2]);
            } catch {
              // 忽略解析失败的对象
            }
          }
          
          // 提取数组参数
          const arrayParams = actionStr.matchAll(/"(\w+)"\s*:\s*(\[[^\]]*\])/g);
          for (const match of arrayParams) {
            try {
              params[match[1]] = JSON.parse(match[2]);
            } catch {
              // 忽略解析失败的数组
            }
          }
          
          result.action = { tool, params };
        }
      }
    }

    // 提取最终答案
    const finalMatch = thinking.match(/\*\*最终答案\*\*[：:]\s*([\s\S]*?)$/);
    if (finalMatch) {
      result.finalAnswer = finalMatch[1].trim();
    }

    return result;
  }

  /**
   * 获取可用工具列表
   */
  getAvailableTools(): string[] {
    return this.toolRegistry.getAllToolDefinitions().map(t => t.name);
  }

  /**
   * 手动注册自定义工具
   */
  registerCustomTool(
    name: string,
    description: string,
    parameters: Record<string, { type: 'string' | 'number' | 'boolean' | 'array' | 'object'; description: string; required?: boolean }>,
    executor: (params: Record<string, unknown>) => Promise<ToolResult>
  ): void {
    this.toolRegistry.register(
      { name, description, parameters },
      executor
    );
  }
}
