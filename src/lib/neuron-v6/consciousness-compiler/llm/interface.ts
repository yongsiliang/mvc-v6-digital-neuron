/**
 * ═══════════════════════════════════════════════════════════════════════
 * LLM 接口 - 意识编译系统的LLM集成
 * 
 * 核心理念：
 * - 能量预算控制LLM调用频率
 * - 编译深度决定调用强度
 * - 本地Attention网络 + LLM协作
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { LLMGateway, LLMMessage, LLMOptions, LLMResponse } from '../../core/llm-gateway';

/**
 * LLM调用级别
 * 
 * 对应编译深度，控制Token消耗
 */
export type LLMCallLevel = 
  | 'none'      // 不调用LLM，纯本地
  | 'minimal'   // 最小调用（摘要）
  | 'standard'  // 标准调用（理解）
  | 'deep'      // 深度调用（分析）
  | 'full';     // 完整调用（推理）

/**
 * LLM调用配置
 */
export interface LLMCallConfig {
  /** 调用级别 */
  level: LLMCallLevel;
  /** 最大Token */
  maxTokens: number;
  /** 是否流式 */
  stream: boolean;
  /** 提示词模板 */
  promptTemplate?: string;
}

/**
 * 不同级别的Token预算
 */
export const TOKEN_BUDGET: Record<LLMCallLevel, number> = {
  none: 0,
  minimal: 500,      // ~500 tokens
  standard: 1500,    // ~1500 tokens
  deep: 3000,        // ~3000 tokens
  full: 6000,        // ~6000 tokens
};

/**
 * 深度到LLM级别的映射
 */
export function depthToLLMLevel(depth: number): LLMCallLevel {
  if (depth <= 1) return 'none';
  if (depth === 2) return 'minimal';
  if (depth === 3) return 'standard';
  if (depth === 4) return 'deep';
  return 'full';
}

/**
 * LLM编译器接口
 * 
 * 封装LLM调用，与本地Attention网络协作
 */
export class LLMCompiler {
  private gateway: LLMGateway | null = null;
  
  constructor(gateway?: LLMGateway) {
    this.gateway = gateway || null;
  }
  
  /**
   * 设置LLM Gateway
   */
  setGateway(gateway: LLMGateway): void {
    this.gateway = gateway;
  }
  
  /**
   * 编译理解请求
   * 
   * 根据深度级别决定如何使用LLM
   */
  async compileUnderstanding(
    input: string,
    context: string[],
    level: LLMCallLevel
  ): Promise<{
    understanding: string;
    confidence: number;
    tokensUsed: number;
  }> {
    // 级别为none时，返回本地结果
    if (level === 'none' || !this.gateway) {
      return this.localUnderstanding(input, context);
    }
    
    // 构建提示词
    const prompt = this.buildPrompt(input, context, level);
    const maxTokens = TOKEN_BUDGET[level];
    
    // 调用LLM
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(level),
      },
      {
        role: 'user',
        content: prompt,
      },
    ];
    
    const options: LLMOptions = {
      maxTokens,
      temperature: 0.7,
      stream: false,
    };
    
    try {
      const response = await this.gateway.chat(messages, options);
      
      // 解析响应
      const parsed = this.parseResponse(response.content);
      
      return {
        understanding: parsed.essence,
        confidence: parsed.confidence,
        tokensUsed: response.usage?.totalTokens || maxTokens,
      };
    } catch (error) {
      console.error('[LLMCompiler] LLM调用失败，降级到本地:', error);
      return this.localUnderstanding(input, context);
    }
  }
  
  /**
   * 本地理解（不调用LLM）
   */
  private localUnderstanding(
    input: string,
    context: string[]
  ): {
    understanding: string;
    confidence: number;
    tokensUsed: number;
  } {
    // 基于上下文的简单理解
    const essence = context.length > 0
      ? `核心概念：${context.slice(0, 3).join('、')}`
      : `理解：${input.slice(0, 50)}`;
    
    return {
      understanding: essence,
      confidence: 0.5, // 本地理解置信度较低
      tokensUsed: 0,
    };
  }
  
  /**
   * 构建提示词
   */
  private buildPrompt(
    input: string,
    context: string[],
    level: LLMCallLevel
  ): string {
    const contextStr = context.length > 0
      ? `\n\n相关上下文：\n${context.map(c => `- ${c}`).join('\n')}`
      : '';
    
    const levelInstructions: Record<LLMCallLevel, string> = {
      none: '',
      minimal: '用1-2句话简洁回答。',
      standard: '提供简洁的理解和分析。',
      deep: '深入分析，提供结构化的理解。',
      full: '全面分析，包括理解、关联、推断和建议。',
    };
    
    return `${levelInstructions[level]}

用户输入：${input}${contextStr}

请输出JSON格式：
{
  "essence": "核心理解",
  "confidence": 0.0-1.0,
  "concepts": ["概念1", "概念2"],
  "reasoning": "推理过程（可选）"
}`;
  }
  
  /**
   * 获取系统提示词
   */
  private getSystemPrompt(level: LLMCallLevel): string {
    const basePrompt = '你是一个认知智能体的理解模块，负责理解用户输入并提取核心概念。';
    
    const levelPrompts: Record<LLMCallLevel, string> = {
      none: basePrompt,
      minimal: `${basePrompt}请极其简洁地回应。`,
      standard: `${basePrompt}请简洁清晰地回应。`,
      deep: `${basePrompt}请深入分析，提供有深度的理解。`,
      full: `${basePrompt}请全面分析，发挥你的最大能力。`,
    };
    
    return levelPrompts[level];
  }
  
  /**
   * 解析LLM响应
   */
  private parseResponse(content: string): {
    essence: string;
    confidence: number;
  } {
    try {
      // 尝试解析JSON
      const json = JSON.parse(content);
      return {
        essence: json.essence || content.slice(0, 100),
        confidence: typeof json.confidence === 'number' 
          ? json.confidence 
          : 0.7,
      };
    } catch {
      // 如果不是JSON，直接使用内容
      return {
        essence: content.slice(0, 200),
        confidence: 0.6,
      };
    }
  }
  
  /**
   * 流式编译（用于深度调用）
   */
  async *compileStream(
    input: string,
    context: string[],
    level: LLMCallLevel
  ): AsyncGenerator<string, void, unknown> {
    if (level === 'none' || !this.gateway) {
      yield this.localUnderstanding(input, context).understanding;
      return;
    }
    
    const prompt = this.buildPrompt(input, context, level);
    const messages: LLMMessage[] = [
      { role: 'system', content: this.getSystemPrompt(level) },
      { role: 'user', content: prompt },
    ];
    
    // TODO: 实现流式调用
    // 目前先返回完整结果
    const result = await this.compileUnderstanding(input, context, level);
    yield result.understanding;
  }
}

/**
 * 创建LLM编译器
 */
export function createLLMCompiler(gateway?: LLMGateway): LLMCompiler {
  return new LLMCompiler(gateway);
}
