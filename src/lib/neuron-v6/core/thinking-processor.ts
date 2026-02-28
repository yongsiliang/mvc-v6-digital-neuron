/**
 * ═══════════════════════════════════════════════════════════════════════
 * 思考处理器 (Thinking Processor)
 * 
 * 职责：
 * - 执行元认知监控的思考过程
 * - 管理思考链
 * - 检测认知偏差
 * - 综合思考结果
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type { ThinkingProcess, ConsciousnessContext } from './types';
import type { MetacognitionEngine } from '../metacognition';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface ThinkingProcessorDeps {
  metacognition: MetacognitionEngine;
}

// ─────────────────────────────────────────────────────────────────────
// 思考处理器
// ─────────────────────────────────────────────────────────────────────

export class ThinkingProcessor {
  private deps: ThinkingProcessorDeps;
  
  constructor(deps: ThinkingProcessorDeps) {
    this.deps = deps;
  }
  
  /**
   * 执行完整思考过程
   */
  async process(input: string, context: ConsciousnessContext): Promise<ThinkingProcess> {
    const thinkingChain: ThinkingProcess['thinkingChain'] = [];
    
    // 感知阶段
    const perception = await this.perceive(input, context);
    thinkingChain.push(perception);
    
    // 分析阶段
    const analysis = await this.analyze(input, context, perception);
    thinkingChain.push(analysis);
    
    // 推理阶段
    const inference = await this.infer(input, context, analysis);
    thinkingChain.push(inference);
    
    // 评估阶段
    const evaluation = await this.evaluate(inference.content, context);
    thinkingChain.push(evaluation);
    
    // 获取元认知上下文
    const metaContext = this.deps.metacognition.getContext();
    
    // 综合思考
    const finalThoughts = this.synthesize(thinkingChain, metaContext);
    
    return {
      id: uuidv4(),
      input,
      thinkingChain,
      detectedBiases: metaContext.biases.map(b => b.name),
      selfQuestions: metaContext.selfQuestions,
      appliedStrategies: metaContext.activeStrategies,
      finalThoughts,
      timestamp: Date.now(),
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 思考阶段
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 感知阶段
   */
  private async perceive(
    input: string, 
    context: ConsciousnessContext
  ): Promise<{ type: string; content: string; confidence: number }> {
    const step = this.deps.metacognition.beginThinkingStep(
      'perception',
      input,
      '感知输入'
    );
    
    const perception = `用户说："${input}"。从我的意义系统看，${context.meaning.meaningSummary || '这是需要理解的输入'}`;
    
    this.deps.metacognition.completeThinkingStep(step, perception, 0.8);
    
    return { type: 'perception', content: perception, confidence: 0.8 };
  }
  
  /**
   * 分析阶段
   */
  private async analyze(
    input: string, 
    context: ConsciousnessContext,
    perception: { content: string }
  ): Promise<{ type: string; content: string; confidence: number }> {
    const step = this.deps.metacognition.beginThinkingStep(
      'analysis',
      perception.content,
      '分析意义'
    );
    
    const parts: string[] = [];
    
    // 从记忆角度
    if (context.memory && context.memory.directMatches.length > 0) {
      parts.push(`这让我想起"${context.memory.directMatches[0].label}"`);
    }
    
    // 从信念角度
    if (context.coreBeliefs.length > 0) {
      parts.push(`基于我的信念"${context.coreBeliefs[0].statement}"`);
    }
    
    // 从价值观角度
    if (context.meaning.valueReminders.length > 0) {
      parts.push(`这触及了我的${context.meaning.valueReminders[0]}价值观`);
    }
    
    const analysis = parts.join('。') || '这是一个新的输入，需要深入理解';
    
    this.deps.metacognition.completeThinkingStep(step, analysis, 0.7);
    
    return { type: 'analysis', content: analysis, confidence: 0.7 };
  }
  
  /**
   * 推理阶段
   */
  private async infer(
    input: string, 
    context: ConsciousnessContext,
    analysis: { content: string }
  ): Promise<{ type: string; content: string; confidence: number }> {
    const step = this.deps.metacognition.beginThinkingStep(
      'inference',
      analysis.content,
      '推理结论'
    );
    
    const parts: string[] = [];
    
    // 结合自我状态
    parts.push(`我现在${context.self.currentState.emotionalState}`);
    
    // 结合记忆
    if (context.memory && context.memory.relevantWisdoms.length > 0) {
      parts.push(`我记得：${context.memory.relevantWisdoms[0].statement}`);
    }
    
    // 提出假设
    parts.push(`我的初步理解是：用户可能在寻求理解或帮助`);
    
    const inference = parts.join('。');
    
    this.deps.metacognition.completeThinkingStep(step, inference, 0.75);
    
    return { type: 'inference', content: inference, confidence: 0.75 };
  }
  
  /**
   * 评估阶段
   */
  private async evaluate(
    inference: string, 
    context: ConsciousnessContext
  ): Promise<{ type: string; content: string; confidence: number }> {
    const step = this.deps.metacognition.beginThinkingStep(
      'evaluation',
      inference,
      '评估质量'
    );
    
    const clarity = context.metacognition.currentState.clarity;
    let evaluation: string;
    let confidence: number;
    
    if (clarity > 0.7) {
      evaluation = `我的思考相对清晰(清晰度${(clarity * 100).toFixed(0)}%)，对结论有信心`;
      confidence = 0.8;
    } else if (clarity > 0.4) {
      evaluation = `我的思考有一定模糊(清晰度${(clarity * 100).toFixed(0)}%)，需要更多信息`;
      confidence = 0.6;
    } else {
      evaluation = `我对这个问题的理解不够清晰，需要更深入地思考`;
      confidence = 0.4;
    }
    
    this.deps.metacognition.completeThinkingStep(step, evaluation, confidence);
    
    return { type: 'evaluation', content: evaluation, confidence };
  }
  
  /**
   * 综合思考
   */
  private synthesize(
    chain: ThinkingProcess['thinkingChain'],
    metaContext: ReturnType<MetacognitionEngine['getContext']>
  ): string {
    const parts = chain.map(s => s.content);
    
    // 添加元认知反思
    if (metaContext.biases.length > 0) {
      parts.push(`但我需要注意${metaContext.biases[0].name}`);
    }
    
    return parts.join(' → ');
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createThinkingProcessor(deps: ThinkingProcessorDeps): ThinkingProcessor {
  return new ThinkingProcessor(deps);
}
