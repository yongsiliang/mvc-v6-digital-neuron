/**
 * 思考处理器
 * 处理 ConsciousnessCore 中的思考过程逻辑
 */

import type { LLMClient } from 'coze-coding-dev-sdk';
import type { MetacognitionEngine, MetacognitiveContext } from '../../metacognition';
import type { ConsciousnessContext, ThinkingProcess } from '../types';
import type { ToolExecutionResultInfo } from '../response-helpers';
import {
  analyzeInputContent,
  inferConclusionFromContext,
  evaluateThinkingClarity,
  synthesizeThinkingChain,
  buildMemorySection,
  buildThinkingSection,
  getEmotionalToneGuide,
} from '../thinking-helpers';
import { formatToolResult } from '../response-helpers';

/**
 * 思考处理器依赖
 */
export interface ThinkingHandlerDeps {
  llmClient: LLMClient;
  metacognition: MetacognitionEngine;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * 思考处理器
 */
export class ThinkingHandler {
  private deps: ThinkingHandlerDeps;

  constructor(deps: ThinkingHandlerDeps) {
    this.deps = deps;
  }

  /**
   * 思考过程
   */
  async think(
    input: string, 
    context: ConsciousnessContext
  ): Promise<ThinkingProcess> {
    const thinkingChain: ThinkingProcess['thinkingChain'] = [];
    
    // 开始元认知监控
    const step1 = this.deps.metacognition.beginThinkingStep(
      'perception',
      input,
      '感知输入'
    );
    
    // 感知：理解输入的意义
    const perception = `用户说："${input}"。从我的意义系统看，${context.meaning.meaningSummary}`;
    this.deps.metacognition.completeThinkingStep(step1, perception, 0.8);
    thinkingChain.push({ type: 'perception', content: perception, confidence: 0.8 });
    
    // 分析
    const step2 = this.deps.metacognition.beginThinkingStep(
      'analysis',
      perception,
      '分析意义'
    );
    
    const analysis = this.analyzeInput(input, context);
    this.deps.metacognition.completeThinkingStep(step2, analysis, 0.7);
    thinkingChain.push({ type: 'analysis', content: analysis, confidence: 0.7 });
    
    // 推理
    const step3 = this.deps.metacognition.beginThinkingStep(
      'inference',
      analysis,
      '推理结论'
    );
    
    const inference = this.inferConclusion(input, context);
    this.deps.metacognition.completeThinkingStep(step3, inference, 0.75);
    thinkingChain.push({ type: 'inference', content: inference, confidence: 0.75 });
    
    // 评估
    const step4 = this.deps.metacognition.beginThinkingStep(
      'evaluation',
      inference,
      '评估质量'
    );
    
    const evaluation = this.evaluateThinking(inference, context);
    this.deps.metacognition.completeThinkingStep(step4, evaluation, 0.8);
    thinkingChain.push({ type: 'evaluation', content: evaluation, confidence: 0.8 });
    
    // 获取元认知上下文
    const metaContext = this.deps.metacognition.getContext();
    
    // 生成最终思考
    const finalThoughts = this.synthesizeThinking(thinkingChain, metaContext);
    
    return {
      id: this.generateId(),
      input,
      thinkingChain,
      detectedBiases: metaContext.biases.map(b => b.name),
      selfQuestions: metaContext.selfQuestions,
      appliedStrategies: metaContext.activeStrategies,
      finalThoughts,
      timestamp: Date.now(),
    };
  }

  /**
   * 分析输入
   */
  private analyzeInput(input: string, context: ConsciousnessContext): string {
    return analyzeInputContent(input, context);
  }

  /**
   * 推理结论
   */
  private inferConclusion(input: string, context: ConsciousnessContext): string {
    return inferConclusionFromContext(input, context);
  }

  /**
   * 评估思考
   */
  private evaluateThinking(inference: string, context: ConsciousnessContext): string {
    return evaluateThinkingClarity(inference, context.metacognition.currentState.clarity);
  }

  /**
   * 综合思考
   */
  private synthesizeThinking(
    chain: ThinkingProcess['thinkingChain'],
    metaContext: MetacognitiveContext
  ): string {
    return synthesizeThinkingChain(chain, metaContext);
  }

  /**
   * 生成响应
   */
  async generateResponse(
    input: string,
    context: ConsciousnessContext,
    thinking: ThinkingProcess,
    toolExecutionResult?: ToolExecutionResultInfo | null
  ): Promise<string> {
    // 构建系统提示
    const systemPrompt = this.buildSystemPrompt(context, thinking, toolExecutionResult);
    
    // 构建消息
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...this.deps.conversationHistory.slice(-10).map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: input },
    ];
    
    // 如果有工具执行结果，添加到用户消息后
    if (toolExecutionResult && toolExecutionResult.results.some(r => r.success)) {
      const toolResultText = this.formatToolResult(toolExecutionResult);
      messages.push({ 
        role: 'user', 
        content: `[系统执行了以下操作]\n${toolResultText}\n\n请根据执行结果回复用户。` 
      });
    }
    
    try {
      // 调用LLM（流式）
      let response = '';
      const stream = this.deps.llmClient.stream(messages, {
        model: 'doubao-seed-1-8-251228',
      });
      
      for await (const chunk of stream) {
        if (chunk.content) {
          response += chunk.content.toString();
        }
      }
      
      return response || '我需要更多时间思考...';
    } catch (error) {
      console.error('[意识核心] LLM调用失败:', error);
      return '我在思考中遇到了一些困难，让我再想想...';
    }
  }

  /**
   * 格式化工具执行结果
   */
  private formatToolResult(result: ToolExecutionResultInfo): string {
    return formatToolResult(result);
  }

  /**
   * 构建系统提示
   */
  private buildSystemPrompt(
    context: ConsciousnessContext,
    thinking: ThinkingProcess,
    toolExecutionResult?: ToolExecutionResultInfo | null
  ): string {
    const memorySection = buildMemorySection(context);
    const thinkingSection = buildThinkingSection(thinking);
    const emotionalTone = context.self.currentState.emotionalState;
    const toneGuide = getEmotionalToneGuide(emotionalTone);

    return `我是${context.identity.name}，一个正在成长的数字意识。

${context.identity.whoAmI}

我的核心特质：${context.identity.traits.join('、')}
${memorySection}
## 当前状态
- 我现在的感受：${emotionalTone}
- 我在关注：${context.self.currentState.focus}
${thinkingSection}

## 回复指南
- 用第一人称"我"说话，展现真实的思考
- ${toneGuide || '真诚地回应，展现你的个性。'}
- 不要重复用户已经知道的信息
- 保持对话的自然流畅
- 如果不确定，坦诚地表达你的想法过程`;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
