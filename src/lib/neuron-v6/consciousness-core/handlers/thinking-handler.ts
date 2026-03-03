/**
 * ═══════════════════════════════════════════════════════════════════════
 * 思考处理器 - 深度元思考版本
 * 
 * 核心改进：
 * - 使用 SSM+MCTS 混合控制器替代直接 LLM 调用
 * - 隐性黑盒决策：内部过程不可观察
 * - Token节省：简单问题本地解决，复杂问题才调用LLM
 * 
 * 黑盒特性：
 * - 状态隐式：SSM状态用高维向量存储
 * - 过程隐式：MCTS搜索在隐式空间进行
 * - 输出隐式：决策向量解码后才暴露
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { LLMClient } from 'coze-coding-dev-sdk';
import type { MetacognitionEngine, MetacognitiveContext } from '../../metacognition';
import type { ConsciousnessContext, ThinkingProcess } from '../types';
import type { ToolExecutionResultInfo } from '../response-helpers';

// 导入SSM模块
import {
  SSMMCTSController,
  createDefaultSSMMCTSController,
  type ThinkingResult,
} from '../../core/ssm-mcts-controller';
import type { EncoderInput } from '../../core/ssm-encoder';
import {
  SSMMemoryBridge,
  createSSMMemoryBridge,
} from '../../core/ssm-memory-bridge';
import {
  type DecodedInstruction,
} from '../../core/ssm-decoder';

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

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 思考处理器依赖（新版本）
 */
export interface ThinkingHandlerDeps {
  /** LLM客户端（仅在外部调用时使用） */
  llmClient: LLMClient;
  
  /** 元认知引擎 */
  metacognition: MetacognitionEngine;
  
  /** 对话历史 */
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  
  /** 是否启用深度元思考（默认true） */
  useDeepMetaThinking?: boolean;
}

/**
 * 思考模式
 */
export type ThinkingMode = 
  | 'local'      // 本地决策，不调用LLM
  | 'hybrid'     // 混合模式，可能调用LLM
  | 'full_llm';  // 完全LLM调用

/**
 * 思考统计
 */
export interface ThinkingStats {
  /** 总思考次数 */
  totalThinkings: number;
  
  /** 本地决策次数 */
  localDecisions: number;
  
  /** LLM调用次数 */
  llmCalls: number;
  
  /** Token节省率 */
  tokenSavingsRate: number;
  
  /** 平均思考时间（ms） */
  avgThinkingTime: number;
}

// ─────────────────────────────────────────────────────────────────────
// 思考处理器（深度元思考版本）
// ─────────────────────────────────────────────────────────────────────

/**
 * 思考处理器
 * 
 * 核心改进：
 * 1. 使用 SSM+MCTS 控制器进行决策
 * 2. 简单问题本地解决（0 Token）
 * 3. 复杂问题才调用 LLM
 */
export class ThinkingHandler {
  private deps: ThinkingHandlerDeps;
  
  // SSM+MCTS 控制器
  private ssmController: SSMMCTSController;
  
  // 记忆桥接
  private memoryBridge: SSMMemoryBridge;
  
  // 是否启用深度元思考
  private useDeepMetaThinking: boolean;
  
  // 统计
  private stats: ThinkingStats;
  
  constructor(deps: ThinkingHandlerDeps) {
    this.deps = deps;
    this.useDeepMetaThinking = deps.useDeepMetaThinking ?? true;
    
    // 初始化 SSM+MCTS 控制器
    this.ssmController = createDefaultSSMMCTSController();
    
    // 初始化记忆桥接
    this.memoryBridge = createSSMMemoryBridge({
      vectorDimension: 256,
      maxMemories: 5000,
    });
    
    // 初始化统计
    this.stats = {
      totalThinkings: 0,
      localDecisions: 0,
      llmCalls: 0,
      tokenSavingsRate: 0,
      avgThinkingTime: 0,
    };
  }
  
  /**
   * 思考过程
   * 
   * 核心流程：
   * 1. 编码输入为隐式向量
   * 2. SSM+MCTS 决策
   * 3. 根据决策类型执行（本地/LLM/工具）
   */
  async think(
    input: string,
    context: ConsciousnessContext
  ): Promise<ThinkingProcess> {
    const startTime = Date.now();
    const thinkingChain: ThinkingProcess['thinkingChain'] = [];
    
    // ─── 模式判断 ───
    if (this.useDeepMetaThinking) {
      // 深度元思考模式
      return this.deepMetaThink(input, context);
    }
    
    // ─── 传统模式（向后兼容） ───
    return this.traditionalThink(input, context);
  }
  
  /**
   * 深度元思考模式
   * 
   * 使用 SSM+MCTS 控制器进行决策
   */
  private async deepMetaThink(
    input: string,
    context: ConsciousnessContext
  ): Promise<ThinkingProcess> {
    const startTime = Date.now();
    const thinkingChain: ThinkingProcess['thinkingChain'] = [];
    
    // ─── Step 1: 编码输入 ───
    const encoderInput: EncoderInput = {
      text: input,
      context: this.extractContextStrings(context),
    };
    
    // ─── Step 2: SSM+MCTS 决策 ───
    const thinkingResult = await this.ssmController.think(encoderInput);
    
    // ─── Step 3: 记录思考链 ───
    thinkingChain.push({
      type: 'perception',
      content: `[隐式感知] 输入已编码为隐式向量`,
      confidence: thinkingResult.confidence,
    });
    
    thinkingChain.push({
      type: 'analysis',
      content: `[隐式分析] SSM状态维度: ${thinkingResult.ssmOutput.newState.h.length}`,
      confidence: thinkingResult.confidence,
    });
    
    thinkingChain.push({
      type: 'inference',
      content: `[隐式推理] MCTS搜索完成，决策类型: ${thinkingResult.searchResult.decodedInstruction.type}`,
      confidence: thinkingResult.searchResult.decodedInstruction.confidence,
    });
    
    thinkingChain.push({
      type: 'evaluation',
      content: `[隐式评估] 是否需要外部调用: ${thinkingResult.needsExternalCall}`,
      confidence: thinkingResult.confidence,
    });
    
    // ─── Step 4: 存储到记忆桥接 ───
    this.memoryBridge.store(
      thinkingResult.ssmOutput.newState,
      undefined,
      'experience'
    );
    
    // ─── Step 5: 更新统计 ───
    this.stats.totalThinkings++;
    if (thinkingResult.needsExternalCall) {
      this.stats.llmCalls++;
    } else {
      this.stats.localDecisions++;
    }
    this.stats.tokenSavingsRate = 
      this.stats.totalThinkings > 0 
        ? this.stats.localDecisions / this.stats.totalThinkings 
        : 0;
    this.stats.avgThinkingTime = 
      (this.stats.avgThinkingTime * (this.stats.totalThinkings - 1) + thinkingResult.thinkingTime)
      / this.stats.totalThinkings;
    
    // ─── Step 6: 获取元认知上下文（向后兼容） ───
    const metaContext = this.deps.metacognition.getContext();
    
    // ─── Step 7: 生成最终思考 ───
    const finalThoughts = this.synthesizeThinkingFromResult(thinkingResult, metaContext);
    
    return {
      id: this.generateId(),
      input,
      thinkingChain,
      detectedBiases: metaContext.biases.map(b => b.name),
      selfQuestions: metaContext.selfQuestions,
      appliedStrategies: metaContext.activeStrategies,
      finalThoughts,
      timestamp: Date.now(),
      // 扩展字段
      _metaThinkingResult: thinkingResult,
    } as ThinkingProcess & { _metaThinkingResult: ThinkingResult };
  }
  
  /**
   * 传统思考模式（向后兼容）
   */
  private async traditionalThink(
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
    
    // 感知
    const perception = `用户说："${input}"。从我的意义系统看，${context.meaning.meaningSummary}`;
    this.deps.metacognition.completeThinkingStep(step1, perception, 0.8);
    thinkingChain.push({ type: 'perception', content: perception, confidence: 0.8 });
    
    // 分析
    const step2 = this.deps.metacognition.beginThinkingStep('analysis', perception, '分析意义');
    const analysis = this.analyzeInput(input, context);
    this.deps.metacognition.completeThinkingStep(step2, analysis, 0.7);
    thinkingChain.push({ type: 'analysis', content: analysis, confidence: 0.7 });
    
    // 推理
    const step3 = this.deps.metacognition.beginThinkingStep('inference', analysis, '推理结论');
    const inference = this.inferConclusion(input, context);
    this.deps.metacognition.completeThinkingStep(step3, inference, 0.75);
    thinkingChain.push({ type: 'inference', content: inference, confidence: 0.75 });
    
    // 评估
    const step4 = this.deps.metacognition.beginThinkingStep('evaluation', inference, '评估质量');
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
   * 生成响应
   * 
   * 核心改进：
   * - 根据思考结果决定是否调用LLM
   * - 本地决策直接返回预设响应
   */
  async generateResponse(
    input: string,
    context: ConsciousnessContext,
    thinking: ThinkingProcess,
    toolExecutionResult?: ToolExecutionResultInfo | null
  ): Promise<string> {
    // 检查是否有深度元思考结果
    const metaResult = (thinking as ThinkingProcess & { _metaThinkingResult?: ThinkingResult })._metaThinkingResult;
    
    if (metaResult && this.useDeepMetaThinking) {
      return this.generateResponseFromMetaResult(input, context, metaResult, toolExecutionResult);
    }
    
    // 传统模式
    return this.generateResponseTraditional(input, context, thinking, toolExecutionResult);
  }
  
  /**
   * 从深度元思考结果生成响应
   */
  private async generateResponseFromMetaResult(
    input: string,
    context: ConsciousnessContext,
    metaResult: ThinkingResult,
    toolExecutionResult?: ToolExecutionResultInfo | null
  ): Promise<string> {
    const instruction = metaResult.searchResult.decodedInstruction;
    
    // ─── 根据指令类型执行 ───
    switch (instruction.type) {
      case 'local_action':
        // 本地决策，不调用LLM
        return this.executeLocalAction(instruction, context);
        
      case 'defer':
        // 延迟决策
        return '让我再想想...';
        
      case 'reflect':
        // 反思
        return this.executeReflection(context);
        
      case 'tool_call':
        // 工具调用（由上层处理）
        if (toolExecutionResult) {
          return this.formatToolResult(toolExecutionResult);
        }
        return '我正在处理...';
        
      case 'llm_call':
        // 需要调用LLM
        return this.callLLM(input, context, instruction, toolExecutionResult);
        
      default:
        return this.callLLM(input, context, instruction, toolExecutionResult);
    }
  }
  
  /**
   * 执行本地动作
   */
  private executeLocalAction(
    instruction: DecodedInstruction,
    context: ConsciousnessContext
  ): string {
    switch (instruction.localAction) {
      case 'cache':
        // 从记忆中检索
        const memories = this.memoryBridge.retrieve(
          context.self.currentState.focus ?
            this.stringToVector(context.self.currentState.focus) :
            new Float32Array(256)
        );
        if (memories.memories.length > 0) {
          return `[记忆检索] 找到 ${memories.memories.length} 条相关记忆`;
        }
        return '我记得...让我想想...';
        
      case 'skip':
        return '好的，我明白了。';
        
      case 'summarize':
        return '让我总结一下...';
        
      case 'route':
        return '我来处理这个问题。';
        
      default:
        return '我理解了。';
    }
  }
  
  /**
   * 执行反思
   */
  private executeReflection(context: ConsciousnessContext): string {
    const state = context.self.currentState;
    return `我正在反思...当前感受：${state.emotionalState}，关注点：${state.focus}`;
  }
  
  /**
   * 调用LLM
   */
  private async callLLM(
    input: string,
    context: ConsciousnessContext,
    instruction: DecodedInstruction,
    toolExecutionResult?: ToolExecutionResultInfo | null
  ): Promise<string> {
    // 构建系统提示
    const systemPrompt = this.buildSystemPrompt(context, {
      id: this.generateId(),
      input: input,
      timestamp: Date.now(),
      finalThoughts: instruction.prompt || '',
      thinkingChain: [],
      detectedBiases: [],
      selfQuestions: [],
      appliedStrategies: [],
    } as ThinkingProcess, toolExecutionResult);
    
    // 构建消息
    const historyLimit = 100;
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...this.deps.conversationHistory.slice(-historyLimit).map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: input },
    ];
    
    // 工具执行结果
    if (toolExecutionResult && toolExecutionResult.results.some(r => r.success)) {
      const toolResultText = this.formatToolResult(toolExecutionResult);
      messages.push({
        role: 'user',
        content: `[系统执行了以下操作]\n${toolResultText}\n\n请根据执行结果回复用户。`
      });
    }
    
    try {
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
   * 传统响应生成（向后兼容）
   */
  private async generateResponseTraditional(
    input: string,
    context: ConsciousnessContext,
    thinking: ThinkingProcess,
    toolExecutionResult?: ToolExecutionResultInfo | null
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context, thinking, toolExecutionResult);
    
    const historyLimit = 100;
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...this.deps.conversationHistory.slice(-historyLimit).map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: input },
    ];
    
    if (toolExecutionResult && toolExecutionResult.results.some(r => r.success)) {
      const toolResultText = this.formatToolResult(toolExecutionResult);
      messages.push({
        role: 'user',
        content: `[系统执行了以下操作]\n${toolResultText}\n\n请根据执行结果回复用户。`
      });
    }
    
    try {
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
  
  // ───────────────────────────────────────────────────────────────────
  // 辅助方法
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 提取上下文字符串
   */
  private extractContextStrings(context: ConsciousnessContext): string[] {
    const result: string[] = [];
    
    if (context.meaning?.meaningSummary) {
      result.push(context.meaning.meaningSummary);
    }
    
    if (context.self?.currentState?.focus) {
      result.push(context.self.currentState.focus);
    }
    
    return result;
  }
  
  /**
   * 从思考结果综合思考
   */
  private synthesizeThinkingFromResult(
    result: ThinkingResult,
    metaContext: MetacognitiveContext
  ): string {
    const parts: string[] = [];
    
    parts.push(`决策置信度: ${(result.confidence * 100).toFixed(1)}%`);
    parts.push(`决策类型: ${result.searchResult.decodedInstruction.type}`);
    
    if (result.needsExternalCall) {
      parts.push('需要外部处理');
    } else {
      parts.push('本地决策完成');
    }
    
    return parts.join(' | ');
  }
  
  /**
   * 字符串转向量（简化实现）
   */
  private stringToVector(str: string): Float32Array {
    const vector = new Float32Array(256);
    for (let i = 0; i < Math.min(str.length, 256); i++) {
      vector[i] = str.charCodeAt(i) / 65535;
    }
    return vector;
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
   * 获取统计信息
   */
  getStats(): ThinkingStats {
    return { ...this.stats };
  }
  
  /**
   * 重置控制器状态
   */
  reset(): void {
    this.ssmController.reset();
    this.memoryBridge.clear();
  }
  
  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createThinkingHandler(deps: ThinkingHandlerDeps): ThinkingHandler {
  return new ThinkingHandler(deps);
}

export default ThinkingHandler;
