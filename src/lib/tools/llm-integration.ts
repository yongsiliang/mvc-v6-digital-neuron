/**
 * ═══════════════════════════════════════════════════════════════════════
 * LLM 工具调用集成
 * LLM Tool Calling Integration
 * 
 * 将工具系统集成到意识系统中，让 LLM 能够调用工具
 * ═══════════════════════════════════════════════════════════════════════
 */

import { randomUUID } from 'crypto';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getToolEngine, ALL_TOOLS, DEFAULT_SECURITY_POLICY } from '@/lib/tools';
import type { ToolCallRequest, ToolResult, AIToolCall } from '@/lib/tools/types';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

export interface ToolCallContext {
  sessionId: string;
  userId: string;
  conversationId: string;
  workingDirectory?: string;
  headers?: Record<string, string>;
}

export interface ToolCallStreamEvent {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'response' | 'error';
  content: string | ToolResult | ParsedToolCall;
  timestamp: number;
}

export type ToolCallStreamHandler = (event: ToolCallStreamEvent) => void;

/**
 * 解析后的工具调用（内部使用）
 */
interface ParsedToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════
// 工具调用器
// ═══════════════════════════════════════════════════════════════════════

export class LLMToolCaller {
  private engine = getToolEngine(DEFAULT_SECURITY_POLICY);

  /**
   * 获取工具定义（供 LLM 使用）
   */
  getToolDefinitionsForLLM(): Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: {
        type: 'object';
        properties: Record<string, unknown>;
        required: string[];
      };
    };
  }> {
    return ALL_TOOLS.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: `${tool.displayName}: ${tool.description}${tool.requiresConfirmation ? ' (需要用户确认)' : ''}`,
        parameters: {
          type: 'object',
          properties: tool.parameters?.reduce((acc, param) => {
            acc[param.name] = {
              type: param.type,
              description: param.description,
              ...(param.enum && { enum: param.enum }),
              ...(param.default !== undefined && { default: param.default }),
            };
            return acc;
          }, {} as Record<string, unknown>) || {},
          required: tool.parameters?.filter(p => p.required).map(p => p.name) || [],
        },
      },
    }));
  }

  /**
   * 处理用户消息，自动决定是否调用工具
   */
  async processMessage(
    userMessage: string,
    context: ToolCallContext,
    onStream?: ToolCallStreamHandler
  ): Promise<string> {
    try {
      // 1. 让 LLM 分析用户意图并决定是否调用工具
      onStream?.({
        type: 'thinking',
        content: '分析用户意图...',
        timestamp: Date.now(),
      });

      // 使用 LLM 分析意图
      const intentAnalysis = await this.analyzeIntent(userMessage, context);

      if (intentAnalysis.toolCalls && intentAnalysis.toolCalls.length > 0) {
        // 2. 执行工具调用
        const toolResults: ToolResult[] = [];

        for (const toolCall of intentAnalysis.toolCalls) {
          onStream?.({
            type: 'tool_call',
            content: toolCall,
            timestamp: Date.now(),
          });

          const result = await this.executeToolCall(toolCall, context);

          onStream?.({
            type: 'tool_result',
            content: result,
            timestamp: Date.now(),
          });

          toolResults.push(result);
        }

        // 3. 基于工具结果生成最终响应
        const finalResponse = await this.generateResponse(userMessage, toolResults, context);

        onStream?.({
          type: 'response',
          content: finalResponse,
          timestamp: Date.now(),
        });

        return finalResponse;
      }

      // 不需要调用工具，直接回复
      onStream?.({
        type: 'response',
        content: intentAnalysis.response || '我理解了您的请求。',
        timestamp: Date.now(),
      });

      return intentAnalysis.response || '我理解了您的请求。';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      onStream?.({
        type: 'error',
        content: errorMessage,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * 创建 LLM 客户端
   */
  private createLLMClient(headers?: Record<string, string>): LLMClient {
    const config = new Config();
    return new LLMClient(config, headers || {});
  }

  /**
   * 分析用户意图
   */
  private async analyzeIntent(
    userMessage: string,
    context: ToolCallContext
  ): Promise<{ toolCalls?: ParsedToolCall[]; response?: string }> {
    const systemPrompt = `你是一个智能助手，可以调用各种工具来帮助用户完成任务。

可用的工具:
${ALL_TOOLS.map(t => `- ${t.name}: ${t.displayName} - ${t.description}`).join('\n')}

根据用户的消息，判断是否需要调用工具。如果需要，返回 JSON 格式的工具调用列表。
如果不需要调用工具，直接给出回复。

返回格式：
{
  "toolCalls": [
    {
      "name": "工具名称",
      "arguments": { 参数对象 }
    }
  ],
  "response": "可选的回复文本"
}

或者直接返回：
{
  "response": "回复文本"
}`;

    try {
      const llm = this.createLLMClient(context.headers);
      const response = await llm.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ], {
        temperature: 0.3,
      });

      const content = typeof response === 'string' ? response : (response as { content?: string }).content || '';

      // 尝试解析 JSON
      try {
        const parsed = JSON.parse(content);
        return {
          toolCalls: parsed.toolCalls?.map((tc: { name: string; arguments: Record<string, unknown> }) => ({
            id: randomUUID(),
            name: tc.name,
            arguments: tc.arguments,
          })),
          response: parsed.response,
        };
      } catch {
        // 不是 JSON，直接作为回复
        return { response: content };
      }
    } catch (error) {
      console.error('[LLMToolCaller] 分析意图失败:', error);
      return { response: '抱歉，我无法理解您的请求。' };
    }
  }

  /**
   * 执行工具调用
   */
  private async executeToolCall(
    toolCall: ParsedToolCall,
    context: ToolCallContext
  ): Promise<ToolResult> {
    const request: ToolCallRequest = {
      id: toolCall.id,
      name: toolCall.name,
      arguments: toolCall.arguments,
      source: 'llm',
      conversationId: context.conversationId,
      timestamp: Date.now(),
    };

    return this.engine.execute(request, {
      workingDirectory: context.workingDirectory || process.cwd(),
      sessionId: context.sessionId,
      headers: context.headers,
    });
  }

  /**
   * 基于工具结果生成响应
   */
  private async generateResponse(
    userMessage: string,
    toolResults: ToolResult[],
    context: ToolCallContext
  ): Promise<string> {
    const systemPrompt = `你是一个智能助手，刚刚执行了一些工具来帮助用户完成任务。
请根据工具执行结果，给用户一个清晰、友好的回复。

工具执行结果:
${toolResults.map((r, i) => `
工具 ${i + 1}: ${r.toolName}
结果: ${r.success ? '成功' : '失败'}
${r.success ? JSON.stringify(r.output, null, 2) : r.error}
`).join('\n')}`;

    try {
      const llm = this.createLLMClient(context.headers);
      const response = await llm.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ], {
        temperature: 0.7,
      });

      return typeof response === 'string' ? response : (response as { content?: string }).content || '';
    } catch (error) {
      console.error('[LLMToolCaller] 生成响应失败:', error);
      // 降级处理：直接返回工具结果
      return `工具执行完成。结果: ${JSON.stringify(toolResults.map(r => ({
        tool: r.toolName,
        success: r.success,
        output: r.success ? r.output : r.error,
      })), null, 2)}`;
    }
  }

  /**
   * 批量执行工具调用（用于处理 LLM 返回的多个 tool_calls）
   */
  async executeToolCalls(
    toolCalls: AIToolCall[],
    context: ToolCallContext
  ): Promise<ToolResult[]> {
    const requests: ToolCallRequest[] = toolCalls.map(tc => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
      source: 'llm' as const,
      conversationId: context.conversationId,
      timestamp: Date.now(),
    }));

    const result = await this.engine.executeBatch({
      id: randomUUID(),
      calls: requests,
      stopOnError: false,
      parallel: true,
    }, {
      workingDirectory: context.workingDirectory || process.cwd(),
      sessionId: context.sessionId,
      headers: context.headers,
    });

    return result.results;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 单例实例
// ═══════════════════════════════════════════════════════════════════════

let llmToolCallerInstance: LLMToolCaller | null = null;

export function getLLMToolCaller(): LLMToolCaller {
  if (!llmToolCallerInstance) {
    llmToolCallerInstance = new LLMToolCaller();
  }
  return llmToolCallerInstance;
}

export function resetLLMToolCaller(): void {
  llmToolCallerInstance = null;
}
