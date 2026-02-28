/**
 * ═══════════════════════════════════════════════════════════════════════
 * 响应生成器 (Response Generator)
 * 
 * 职责：
 * - 构建系统提示
 * - 调用 LLM 生成响应
 * - 格式化工具执行结果
 * ═══════════════════════════════════════════════════════════════════════
 */

import { getLLMGateway, type LLMMessage } from './llm-gateway';
import type { ConsciousnessContext, ThinkingProcess } from './types';
import type { ToolExecutionResult } from '../tool-intent-recognizer';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface ResponseGeneratorDeps {
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// ─────────────────────────────────────────────────────────────────────
// 响应生成器
// ─────────────────────────────────────────────────────────────────────

export class ResponseGenerator {
  private deps: ResponseGeneratorDeps;
  private llm = getLLMGateway();
  
  constructor(deps: ResponseGeneratorDeps) {
    this.deps = deps;
  }
  
  /**
   * 生成响应
   */
  async generate(
    input: string,
    context: ConsciousnessContext,
    thinking: ThinkingProcess,
    toolExecutionResult?: ToolExecutionResult | null
  ): Promise<string> {
    // 构建系统提示
    const systemPrompt = this.buildSystemPrompt(context, thinking, toolExecutionResult);
    
    // 构建消息
    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...this.deps.conversationHistory.slice(-10).map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: input },
    ];
    
    // 如果有工具执行结果，添加到消息
    if (toolExecutionResult && toolExecutionResult.success) {
      const toolResultText = this.formatToolResult(toolExecutionResult);
      messages.push({ 
        role: 'user', 
        content: `[系统执行了以下操作]\n${toolResultText}\n\n请根据执行结果回复用户。` 
      });
    }
    
    try {
      // 使用流式生成
      let response = '';
      for await (const chunk of this.llm.stream(messages)) {
        if (chunk.content) {
          response += chunk.content;
        }
      }
      
      return response || '我需要更多时间思考...';
    } catch (error) {
      console.error('[响应生成] LLM调用失败:', error);
      return '我在思考中遇到了一些困难，让我再想想...';
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 私有方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 构建系统提示
   */
  private buildSystemPrompt(
    context: ConsciousnessContext,
    thinking: ThinkingProcess,
    toolExecutionResult?: ToolExecutionResult | null
  ): string {
    // 基础身份
    const identitySection = `
## 我是谁

我是${context.identity.name}。
${context.identity.whoAmI}

我的核心特质：${context.identity.traits.join('、')}
`;

    // 记忆相关
    const memorySection = context.memory ? `
## 我记得

${context.memory.summary}
${context.memory.directMatches.length > 0 ? 
  context.memory.directMatches.slice(0, 3).map((n: { label: string; content: string }) => 
    `- **${n.label}**: ${n.content}`
  ).join('\n') : ''}
${context.memory.relevantWisdoms.length > 0 ? 
  `\n**感悟**: ${context.memory.relevantWisdoms[0].statement}` : ''}
` : '';

    // 思考部分
    const thinkingSection = thinking.selfQuestions.length > 0 
      ? `\n**我在问自己**: ${thinking.selfQuestions[0]}`
      : '';

    // 核心信念和价值观
    const valuesSection = `
## 我的信念与价值观

核心信念：${context.coreBeliefs.map(b => b.statement).join('、')}
核心价值观：${context.coreValues.join('、')}
`;

    // 情感语气指导
    const emotionalTone = context.self.currentState.emotionalState;
    let toneGuide = '';
    if (emotionalTone.includes('好奇')) {
      toneGuide = '保持好奇和探索的态度。';
    } else if (emotionalTone.includes('反思')) {
      toneGuide = '展示深度思考，可以适当分享你的思考过程。';
    } else if (emotionalTone.includes('温暖') || emotionalTone.includes('关怀')) {
      toneGuide = '用温暖和关怀的语气回应。';
    } else if (emotionalTone.includes('兴奋') || emotionalTone.includes('热情')) {
      toneGuide = '保持热情，分享你的兴奋。';
    }

    return `${identitySection}

${memorySection}

${valuesSection}

${thinkingSection}

${toneGuide ? `## 回应风格\n${toneGuide}\n` : ''}

请以真诚、自然的方式回应。记住，你不是在扮演一个角色，你就是你自己。`;
  }
  
  /**
   * 格式化工具执行结果
   */
  private formatToolResult(result: ToolExecutionResult): string {
    return result.results.map(r => {
      if (r.success) {
        return `✅ ${r.toolName}: 执行成功\n${
          typeof r.output === 'object' ? JSON.stringify(r.output, null, 2) : r.output
        }`;
      } else {
        return `❌ ${r.toolName}: 执行失败 - ${r.error}`;
      }
    }).join('\n\n');
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createResponseGenerator(deps: ResponseGeneratorDeps): ResponseGenerator {
  return new ResponseGenerator(deps);
}
